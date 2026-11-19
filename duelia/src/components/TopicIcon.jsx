export default function TopicIcon({ topic, size = 64 }) {
  return (
    <span className="topic-icon" style={{ '--c': topic.color, width: size, height: size, fontSize: size * 0.52 }}>
      <span>{topic.icon}</span>
    </span>
  )
}
