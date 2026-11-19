export function lessonState(s, theme, index) {
  const lesson = theme.lessons[index]
  if (s.lessons[lesson.id]) return 'done'
  if (index === 0 || s.lessons[theme.lessons[index - 1].id]) return 'open'
  return 'locked'
}
