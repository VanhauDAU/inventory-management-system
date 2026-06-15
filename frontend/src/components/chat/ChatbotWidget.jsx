import { useEffect, useRef, useState } from 'react'
import api from '../../services/api'
import './ChatbotWidget.css'

const welcomeMessage = {
  role: 'assistant',
  content: 'Xin chào. Tôi có thể hỗ trợ tra cứu sản phẩm, tồn kho, giao dịch và hướng dẫn sử dụng ProductMS theo quyền của bạn.',
}

const suggestions = [
  'Sản phẩm nào đang sắp hết hàng?',
  'Tóm tắt tình hình tồn kho',
  'Các giao dịch kho gần đây',
]

function getErrorMessage(error) {
  return error.response?.data?.detail
    || 'Chatbot chưa thể phản hồi. Vui lòng thử lại sau.'
}

export default function ChatbotWidget({ currentUser }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([welcomeMessage])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, sending])

  async function sendMessage(rawMessage) {
    const message = rawMessage.trim()
    if (!message || sending) return

    const userMessage = { role: 'user', content: message }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setSending(true)

    try {
      const history = nextMessages
        .filter((item) => item !== welcomeMessage)
        .slice(-10)
        .map(({ role, content }) => ({ role, content }))
      const response = await api.post('/ai/chat/', { message, history: history.slice(0, -1) })
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: response.data.reply },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: getErrorMessage(error), error: true },
      ])
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendMessage(input)
  }

  function resetConversation() {
    setMessages([welcomeMessage])
    setInput('')
  }

  return (
    <div className="chatbot">
      {open && (
        <section className="chatbot-panel" aria-label="Trợ lý ProductMS">
          <header className="chatbot-header">
            <div className="chatbot-brand">
              <span className="chatbot-logo">AI</span>
              <div>
                <strong>Trợ lý ProductMS</strong>
                <small>{currentUser?.full_name || currentUser?.username || 'Người dùng'}</small>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button type="button" onClick={resetConversation} aria-label="Xóa hội thoại">↻</button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng chatbot">×</button>
            </div>
          </header>

          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div className={`chatbot-message ${message.role}${message.error ? ' error' : ''}`} key={`${message.role}-${index}`}>
                <span>{message.content}</span>
              </div>
            ))}
            {sending && (
              <div className="chatbot-message assistant typing">
                <i />
                <i />
                <i />
              </div>
            )}
            <div ref={endRef} />
          </div>

          {messages.length === 1 && (
            <div className="chatbot-suggestions">
              {suggestions.map((suggestion) => (
                <button type="button" key={suggestion} onClick={() => sendMessage(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form className="chatbot-form" onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  handleSubmit(event)
                }
              }}
              placeholder="Nhập câu hỏi..."
              rows={1}
              maxLength={2000}
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()} aria-label="Gửi câu hỏi">
              Gửi
            </button>
          </form>
          <footer>Chatbot chỉ đọc và tư vấn, không tự thay đổi dữ liệu.</footer>
        </section>
      )}

      <button
        type="button"
        className={`chatbot-toggle${open ? ' open' : ''}`}
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Đóng trợ lý' : 'Mở trợ lý'}
      >
        {open ? '×' : 'AI'}
      </button>
    </div>
  )
}
