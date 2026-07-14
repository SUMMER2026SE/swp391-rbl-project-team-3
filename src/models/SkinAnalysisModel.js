import { supabase } from '../supabaseClient';

// AI skin-scan persistence. One scan = one photo in the PRIVATE `skin-scans`
// bucket + one skin_images row + one ai_skin_analyses row. Only REAL model
// predictions are ever saved — the caller (FreeSkinScanModal) must never pass a
// simulated/demo result here, so nothing fabricated can reach a medical record.
//
// skin_images.image_url stores the storage PATH (not a URL): the bucket is
// private, so every display goes through a short-lived signed URL minted at
// read time in getByPatient().

const BUCKET = 'skin-scans';
const SIGNED_URL_TTL = 60 * 60; // 1h — plenty for one workspace session

export const SkinAnalysisModel = {
  // Persist a real AI scan for a logged-in patient. Returns the analysis row,
  // or null on failure (callers treat saving as best-effort: the on-screen
  // result is never blocked by a failed save).
  async saveScan({ patientId, file, predictedClass, conditionName, confidence, recommendation }) {
    if (!patientId || !file) return null;
    try {
      // FK chain: ai_skin_analyses.patient_id → patient_profiles. A patient who
      // signed up but never booked may not have a profile row yet.
      await supabase
        .from('patient_profiles')
        .upsert([{ patient_id: patientId }], { onConflict: 'patient_id' });

      // 1. Photo → private bucket, namespaced by patient uuid (the storage RLS
      // policies key ownership off this first path segment).
      const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `${patientId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
      if (upErr) throw upErr;

      // 2. skin_images row (image_id FK anchor for the analysis).
      const { data: imgRows, error: imgErr } = await supabase
        .from('skin_images')
        .insert([{
          patient_id: patientId,
          uploaded_by: patientId,
          image_url: path,
          image_type: 'AI_SCAN',
        }])
        .select('image_id');
      if (imgErr) throw imgErr;

      // 3. The analysis itself.
      const pct = Math.round((Number(confidence) || 0) * 100);
      const { data: rows, error: anErr } = await supabase
        .from('ai_skin_analyses')
        .insert([{
          patient_id: patientId,
          image_id: imgRows[0].image_id,
          detected_condition: conditionName || predictedClass || 'Không xác định',
          confidence_score: Number(confidence) || null,
          result_summary: `AI phát hiện: ${conditionName || predictedClass} (độ tin cậy ${pct}%).`,
          recommendation: recommendation || null,
        }])
        .select();
      if (anErr) throw anErr;

      // 4. ENFORCE MAX 4 SCANS — prune oldest records after a successful insert.
      //    We do this AFTER insert so we always get an accurate count including
      //    the record we just saved. Errors here are non-fatal (scan is already saved).
      try {
        const { data: allScans, error: fetchErr } = await supabase
          .from('ai_skin_analyses')
          .select('analysis_id, image_id, image:skin_images(image_url)')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: true }); // oldest first

        console.log('[SkinAnalysisModel] Total scans after insert:', allScans?.length, fetchErr?.message);

        if (!fetchErr && allScans && allScans.length > 4) {
          const excess = allScans.slice(0, allScans.length - 4); // oldest to delete
          console.log('[SkinAnalysisModel] Pruning', excess.length, 'old scan(s)');
          for (const old of excess) {
            await SkinAnalysisModel.deleteScan(old.analysis_id, old.image_id, old.image?.image_url);
          }
        }
      } catch (pruneErr) {
        console.warn('[SkinAnalysisModel] Prune step failed (non-fatal):', pruneErr.message);
      }

      return rows[0];
    } catch (e) {
      console.warn('[SkinAnalysisModel] Failed to save scan:', e.message);
      return null;
    }
  },

  // All scans of one patient, newest first, each carrying a signed `imageUrl`
  // (null when the URL could not be minted — the UI shows a placeholder).
  async getByPatient(patientId) {
    if (!patientId) return [];
    try {
      const { data, error } = await supabase
        .from('ai_skin_analyses')
        .select('analysis_id, detected_condition, confidence_score, result_summary, recommendation, created_at, image_id, image:skin_images(image_url)')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const scans = data || [];
      const paths = scans.map((s) => s.image?.image_url).filter(Boolean);
      let urlByPath = {};
      if (paths.length > 0) {
        const { data: signed, error: sErr } = await supabase.storage
          .from(BUCKET)
          .createSignedUrls(paths, SIGNED_URL_TTL);
        if (!sErr && Array.isArray(signed)) {
          signed.forEach((s) => {
            if (s?.signedUrl && s?.path) urlByPath[s.path] = s.signedUrl;
          });
        }
      }

      return scans.map((s) => ({
        id: s.analysis_id,
        condition: s.detected_condition,
        confidence: s.confidence_score != null ? Number(s.confidence_score) : null,
        summary: s.result_summary,
        recommendation: s.recommendation,
        createdAt: s.created_at,
        imageUrl: urlByPath[s.image?.image_url] || null,
        imageId: s.image_id,
        imagePath: s.image?.image_url || null,
      }));
    } catch (e) {
      console.warn('[SkinAnalysisModel] Failed to load scans:', e.message);
      return [];
    }
  },

  // Delete a scan from both DB tables and storage bucket JIT
  async deleteScan(analysisId, imageId, imagePath) {
    if (!analysisId) return false;
    try {
      // 1. Delete from DB analyses
      const { error: err1 } = await supabase
        .from('ai_skin_analyses')
        .delete()
        .eq('analysis_id', analysisId);
      if (err1) throw err1;

      // 2. Delete from DB images
      if (imageId) {
        const { error: err2 } = await supabase
          .from('skin_images')
          .delete()
          .eq('image_id', imageId);
        if (err2) throw err2;
      }

      // 3. Delete file from storage bucket
      if (imagePath) {
        const { error: err3 } = await supabase.storage
          .from(BUCKET)
          .remove([imagePath]);
        if (err3) {
          console.warn('[SkinAnalysisModel] Failed to delete file from storage bucket:', err3.message);
        }
      }

      return true;
    } catch (e) {
      console.warn('[SkinAnalysisModel] Failed to delete scan:', e.message);
      return false;
    }
  }
};
