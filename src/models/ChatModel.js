// Database schema manager for Doctor-Patient Chats using LocalStorage
// Provides full persistence for online consultations between doctors and patients.

const CHATS_KEY = 'dermasmart_doctor_chats';

const MOCK_CHAT_MESSAGES_INITIAL = [
  {
    id: "dmsg-01",
    senderId: "pat-01",
    senderName: "Lê Minh Khôi",
    senderRole: "PATIENT",
    receiverId: "doc-01",
    receiverName: "BS. CKII. Trần Văn A",
    text: "Chào bác sĩ A, em muốn hỏi sau khi bắn laser da mặt bị đỏ nhẹ thì có cần chườm đá hay thoa kem dịu da ngay không ạ?",
    timestamp: "2026-06-01T09:00:00Z",
    mode: "Doctor"
  },
  {
    id: "dmsg-02",
    senderId: "doc-01",
    senderName: "BS. CKII. Trần Văn A",
    senderRole: "DOCTOR",
    receiverId: "pat-01",
    receiverName: "Lê Minh Khôi",
    text: "Chào Khôi, sau khi bắn laser việc đỏ nhẹ là hoàn toàn bình thường. Em nên thoa kem dưỡng làm dịu da (loại bác sĩ đã kê) 2 lần/ngày. Tránh chườm đá trực tiếp nhé vì nhiệt độ quá lạnh có thể gây tổn thương thêm cho da.",
    timestamp: "2026-06-01T09:05:00Z",
    mode: "Doctor"
  },
  {
    id: "dmsg-03",
    senderId: "pat-01",
    senderName: "Lê Minh Khôi",
    senderRole: "PATIENT",
    receiverId: "doc-01",
    receiverName: "BS. CKII. Trần Văn A",
    text: "Dạ vâng em cảm ơn bác sĩ nhiều ạ! Em sẽ bôi kem dưỡng ẩm dịu da đúng theo chỉ dẫn.",
    timestamp: "2026-06-01T09:07:00Z",
    mode: "Doctor"
  }
];

export const ChatModel = {
  _loadMessages() {
    try {
      const data = localStorage.getItem(CHATS_KEY);
      if (!data) {
        localStorage.setItem(CHATS_KEY, JSON.stringify(MOCK_CHAT_MESSAGES_INITIAL));
        return MOCK_CHAT_MESSAGES_INITIAL;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to load doctor chats from localStorage", e);
      return MOCK_CHAT_MESSAGES_INITIAL;
    }
  },

  getAllMessages() {
    return this._loadMessages();
  },

  getMessagesBetween(pId, dId) {
    const list = this._loadMessages();
    return list.filter(msg => 
      (msg.senderId === pId && msg.receiverId === dId) ||
      (msg.senderId === dId && msg.receiverId === pId)
    );
  },

  addMessage(msgData) {
    const list = this._loadMessages();
    const newMsg = {
      id: `dmsg-${Math.floor(10000 + Math.random() * 90000)}`,
      senderId: msgData.senderId,
      senderName: msgData.senderName,
      senderRole: msgData.senderRole,
      receiverId: msgData.receiverId,
      receiverName: msgData.receiverName,
      text: msgData.text,
      timestamp: new Date().toISOString(),
      mode: "Doctor"
    };
    list.push(newMsg);
    localStorage.setItem(CHATS_KEY, JSON.stringify(list));
    return newMsg;
  }
};

const RECEPTIONIST_CHATS_KEY = 'dermasmart_receptionist_chats';

const MOCK_RECEPTIONIST_CHAT_MESSAGES_INITIAL = [
  {
    id: "msg-01",
    senderId: "bot",
    senderName: "DermaSmart AI",
    senderRole: "BOT",
    text: "Xin chào! Tôi là trợ lý AI của DermaSmart. Tôi có thể giúp bạn đặt lịch khám, kiểm tra tình trạng da hoặc giải đáp thắc mắc. Bạn cần hỗ trợ gì hôm nay?",
    timestamp: "2026-06-01T08:00:00Z",
    mode: "AI",
    patientId: "pat-01"
  },
  {
    id: "msg-02",
    senderId: "pat-01",
    senderName: "Lê Minh Khôi",
    senderRole: "PATIENT",
    text: "Chào bạn, tôi muốn hỏi về lịch khám ngày mai với BS. Trần Văn A có còn không?",
    timestamp: "2026-06-01T08:01:30Z",
    mode: "AI",
    patientId: "pat-01"
  },
  {
    id: "msg-03",
    senderId: "bot",
    senderName: "DermaSmart AI",
    senderRole: "BOT",
    text: "BS. CKII. Trần Văn A hiện còn trống lịch vào ngày mai (02/06) lúc 09:00 và 10:30. Bạn muốn đặt khung giờ nào ạ?",
    timestamp: "2026-06-01T08:02:00Z",
    mode: "AI",
    patientId: "pat-01"
  },
  {
    id: "msg-04",
    senderId: "pat-01",
    senderName: "Lê Minh Khôi",
    senderRole: "PATIENT",
    text: "Cho tôi chuyển sang nói chuyện với nhân viên lễ tân được không?",
    timestamp: "2026-06-01T08:03:15Z",
    mode: "AI",
    patientId: "pat-01"
  },
  {
    id: "msg-05",
    senderId: "bot",
    senderName: "DermaSmart AI",
    senderRole: "BOT",
    text: "Đã chuyển sang kênh hỗ trợ trực tiếp. Nhân viên lễ tân sẽ phản hồi bạn trong giây lát. 🎧",
    timestamp: "2026-06-01T08:03:20Z",
    mode: "AI",
    patientId: "pat-01"
  },
  {
    id: "msg-06",
    senderId: "staff-01",
    senderName: "Lễ tân Hoàng Anh",
    senderRole: "RECEPTIONIST",
    text: "Chào anh Khôi! Em là Hoàng Anh, lễ tân phòng khám DermaSmart. Anh cần hỗ trợ gì thêm về lịch khám ạ?",
    timestamp: "2026-06-01T08:05:00Z",
    mode: "Live",
    patientId: "pat-01"
  },
  {
    id: "msg-07",
    senderId: "pat-01",
    senderName: "Lê Minh Khôi",
    senderRole: "PATIENT",
    text: "Chào em, anh muốn đổi lịch khám từ ngày 05/06 sang 06/06 được không? Anh bận họp buổi sáng ngày 5.",
    timestamp: "2026-06-01T08:06:10Z",
    mode: "Live",
    patientId: "pat-01"
  },
  {
    id: "msg-08",
    senderId: "staff-01",
    senderName: "Lễ tân Hoàng Anh",
    senderRole: "RECEPTIONIST",
    text: "Dạ để em kiểm tra lịch BS. Trần Văn A ngày 06/06. Ngày 06/06 là thứ Sáu, BS có lịch từ 13:30 - 17:00. Anh có muốn chọn khung 14:00 không ạ?",
    timestamp: "2026-06-01T08:07:30Z",
    mode: "Live",
    patientId: "pat-01"
  },
  {
    id: "msg-09",
    senderId: "pat-01",
    senderName: "Lê Minh Khôi",
    senderRole: "PATIENT",
    text: "14:00 ngày 06/06 được nhé. Cảm ơn em!",
    timestamp: "2026-06-01T08:08:00Z",
    mode: "Live",
    patientId: "pat-01"
  },
  {
    id: "msg-10",
    senderId: "staff-01",
    senderName: "Lễ tân Hoàng Anh",
    senderRole: "RECEPTIONIST",
    text: "Dạ em đã cập nhật lịch cho anh rồi ạ. Anh nhớ đến trước 15 phút để làm thủ tục nhé. Chúc anh một ngày tốt lành! 😊",
    timestamp: "2026-06-01T08:09:00Z",
    mode: "Live",
    patientId: "pat-01"
  }
];

export const ReceptionistChatModel = {
  _loadMessages() {
    try {
      const data = localStorage.getItem(RECEPTIONIST_CHATS_KEY);
      if (!data) {
        localStorage.setItem(RECEPTIONIST_CHATS_KEY, JSON.stringify(MOCK_RECEPTIONIST_CHAT_MESSAGES_INITIAL));
        return MOCK_RECEPTIONIST_CHAT_MESSAGES_INITIAL;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to load receptionist chats from localStorage", e);
      return MOCK_RECEPTIONIST_CHAT_MESSAGES_INITIAL;
    }
  },

  getAllMessages() {
    return this._loadMessages();
  },

  getMessagesForPatient(patientId) {
    const list = this._loadMessages();
    return list.filter(msg => msg.patientId === patientId);
  },

  addMessage(msgData) {
    const list = this._loadMessages();
    const newMsg = {
      id: `msg-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      senderId: msgData.senderId,
      senderName: msgData.senderName,
      senderRole: msgData.senderRole,
      text: msgData.text,
      timestamp: new Date().toISOString(),
      mode: msgData.mode || "Live",
      patientId: msgData.patientId
    };
    list.push(newMsg);
    localStorage.setItem(RECEPTIONIST_CHATS_KEY, JSON.stringify(list));
    return newMsg;
  }
};
