import React from 'react';
import { FlaskConical, ImageOff, Hourglass, Loader2, CheckCircle2 } from 'lucide-react';
import { GLASS_BASE } from '../../../common/GlassCard';

// Results the TECHNICIAN produced for the indications the doctor ordered on THIS
// appointment. (This panel used to be called "AISkinAnalysis" and wore a brain
// icon, which made every technician photo look like an AI skin scan the patient
// had run — there is no patient-facing AI scan wired up at all.)
//
// It renders straight off the `tickets` the workspace already loaded for this
// appointment, so it can never surface a result from the patient's *other*
// visits, never drops a result that has no photo attached, and stays in sync via
// the workspace's existing Realtime subscription — no query of its own.

const STATUS_UI = {
  TECH_COMPLETED: {
    label: 'Đã có kết quả',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    Icon: CheckCircle2,
  },
  IN_PROGRESS: {
    label: 'KTV đang thực hiện',
    cls: 'bg-sky-50 text-sky-700 border-sky-200/60',
    Icon: Loader2,
  },
  PENDING: {
    label: 'Chờ kỹ thuật viên',
    cls: 'bg-amber-50 text-amber-700 border-amber-200/60',
    Icon: Hourglass,
  },
};

const formatWhen = (iso) =>
  iso
    ? new Date(iso).toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric',
      })
    : null;

function TicketCard({ ticket }) {
  const status = STATUS_UI[ticket.status] || STATUS_UI.PENDING;
  const isDone = ticket.status === 'TECH_COMPLETED';

  // Images: the JSONB list is authoritative; result_image_url is the legacy
  // single-image column kept for tickets completed before that migration.
  const listed = Array.isArray(ticket.result_images) ? ticket.result_images : [];
  const images = listed.filter((img) => img?.url).map((img, i) => ({
    url: img.url,
    name: img.name || `Ảnh ${i + 1}`,
  }));
  if (ticket.result_image_url && !images.some((i) => i.url === ticket.result_image_url)) {
    images.unshift({ url: ticket.result_image_url, name: 'Ảnh kết quả' });
  }

  const metrics =
    ticket.result_metrics && typeof ticket.result_metrics === 'object'
      ? ticket.result_metrics
      : {};
  // `fallbackResult` is the technician's free-text answer for procedures that
  // have no structured metric grid — it is a conclusion, not a lab value.
  const freeText = metrics.fallbackResult;
  const metricEntries = Object.entries(metrics).filter(([k]) => k !== 'fallbackResult');
  const notes = ticket.result_notes || '';

  const hasAnyResult = images.length > 0 || metricEntries.length > 0 || !!notes || !!freeText;

  return (
    <div className="bg-white/60 border border-slate-200/60 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-bold text-sm text-slate-900 truncate">{ticket.service_name}</p>
          {isDone && formatWhen(ticket.updated_at) && (
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              Hoàn thành {formatWhen(ticket.updated_at)}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${status.cls}`}
        >
          <status.Icon className={`w-3 h-3 ${ticket.status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} />
          {status.label}
        </span>
      </div>

      {!isDone ? (
        <p className="text-xs font-medium text-slate-500 italic">
          Chưa có kết quả — chỉ định đã được gửi sang phòng kỹ thuật.
        </p>
      ) : !hasAnyResult ? (
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl px-3 py-2.5">
          <ImageOff className="w-4 h-4 shrink-0" />
          Kỹ thuật viên đã hoàn tất nhưng không đính kèm kết quả nào.
        </div>
      ) : (
        <div className="space-y-3">
          {images.length > 0 && (
            <div className={`grid gap-2.5 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {images.map((img) => (
                <div
                  key={img.url}
                  className="relative rounded-xl overflow-hidden border border-slate-200/60 bg-slate-50 min-h-[8rem]"
                >
                  {/* NOT `loading="lazy"`: with `h-auto` the element is 0px tall
                      until the photo decodes, so the lazy IntersectionObserver
                      never saw it intersect, never fetched it, and it stayed 0px
                      forever — the card announced "Đã có kết quả" over an empty
                      strip. These are the few result photos the doctor opened the
                      record to read, so they load eagerly. */}
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-auto max-h-72 object-contain"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2.5 py-1.5">
                    <span className="text-[10px] font-semibold text-white/90">{img.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {metricEntries.length > 0 && (
            <div>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                Chỉ số
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {metricEntries.map(([key, value]) => (
                  <div key={key} className="bg-white/70 px-3 py-2 rounded-xl border border-slate-200/60">
                    <span className="block text-[10px] font-bold text-slate-500 mb-0.5">{key}</span>
                    <span className="text-sm font-bold text-slate-900">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {freeText && (
            <div className="bg-sky-50/60 border border-sky-200/50 rounded-xl p-3">
              <h4 className="text-[10px] font-black text-sky-700 uppercase tracking-wider mb-1">
                Kết quả ghi nhận
              </h4>
              <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap">{freeText}</p>
            </div>
          )}

          {notes && (
            <div className="bg-amber-50/60 border border-amber-200/50 rounded-xl p-3">
              <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-1">
                Ghi chú Kỹ thuật viên
              </h4>
              <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap">{notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TechnicianResults({ tickets = [] }) {
  // Nothing ordered for this visit → the doctor gets no empty panel at all.
  if (!Array.isArray(tickets) || tickets.length === 0) return null;

  const doneCount = tickets.filter((t) => t.status === 'TECH_COMPLETED').length;

  return (
    <div className={`${GLASS_BASE} water-refract rounded-2xl p-6 text-left`}>
      <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200/40">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-sky-600" />
          Kết quả cận lâm sàng
        </h3>
        <span className="text-[11px] font-bold text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-full">
          {doneCount}/{tickets.length} có kết quả
        </span>
      </div>

      <div className="space-y-3">
        {tickets.map((t) => (
          <TicketCard key={t.id} ticket={t} />
        ))}
      </div>
    </div>
  );
}
