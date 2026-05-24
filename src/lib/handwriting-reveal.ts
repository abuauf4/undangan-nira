import { gsap } from 'gsap'

export function handwritingReveal(
  el: HTMLDivElement,
  stagger: number = 0.022,
  charDuration: number = 0.08,
  delay: number = 0,
) {
  if (!el) return
  const fullText = el.textContent || ''
  el.innerHTML = ''

  const allChars: HTMLSpanElement[] = []
  const words = fullText.split(' ')
  words.forEach((word, wi) => {
    const ws = document.createElement('span')
    ws.style.cssText = 'white-space:nowrap;display:inline;'
    for (let j = 0; j < word.length; j++) {
      const cs = document.createElement('span')
      cs.className = 'hw-char'
      cs.style.cssText = 'display:inline-block;will-change:opacity,transform;opacity:0;transform:translateY(3px) rotate(-2deg);min-width:0.08em;'
      cs.textContent = word[j]
      ws.appendChild(cs)
      allChars.push(cs)
    }
    el.appendChild(ws)
    if (wi < words.length - 1) {
      const sp = document.createElement('span')
      sp.innerHTML = '\u00A0'
      sp.style.display = 'inline'
      el.appendChild(sp)
    }
  })

  gsap.to(allChars, {
    opacity: 1,
    y: 0,
    rotation: 0,
    duration: charDuration,
    stagger,
    ease: 'power2.out',
    delay,
  })
}
