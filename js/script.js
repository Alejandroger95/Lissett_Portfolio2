(() => {
    const root = document.documentElement
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches

    const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
    const lerp = (a, b, t) => a + (b - a) * t
    const smooth = (a, b, v) => {
        const t = clamp((v - a) / (b - a), 0, 1)
        return t * t * (3 - 2 * t)
    }
    const seeded = seed => () => {
        seed = (seed + 0x6d2b79f5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }

    // Foto de perfil: si no existe el archivo, se muestran las iniciales
    document.querySelectorAll('img[data-fallback]').forEach(img => {
        const swap = () => {
            const fallback = document.createElement('div')
            fallback.className = 'photo-fallback'
            fallback.textContent = img.dataset.fallback
            fallback.setAttribute('role', 'img')
            fallback.setAttribute('aria-label', img.alt)
            img.replaceWith(fallback)
        }
        img.addEventListener('error', swap)
        if (img.complete && img.naturalWidth === 0) swap()
    })

    // Fotos de eventos: sin archivo se ve el recuadro de color con el nombre esperado
    document.querySelectorAll('.media img').forEach(img => {
        const mark = () => img.parentElement.classList.add('no-img')
        img.addEventListener('error', mark)
        if (img.complete && img.naturalWidth === 0) mark()
    })

    // Aparición progresiva de textos
    const revealer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in')
                revealer.unobserve(entry.target)
            }
        })
    }, { threshold: 0.15 })
    document.querySelectorAll('.reveal').forEach(el => revealer.observe(el))

    // Cursor: anillo con retardo que se convierte en flecha al hacer scroll
    const cursor = document.querySelector('.cursor')
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 }

    if (cursor && finePointer && !reduced) {
        root.classList.add('has-cursor')
        const ring = cursor.querySelector('.cursor-ring')
        const dot = cursor.querySelector('.cursor-dot')
        const label = cursor.querySelector('.cursor-label')
        let ringX = pointer.x
        let ringY = pointer.y
        let lastScroll = window.scrollY
        let scrollTimer

        window.addEventListener('mousemove', e => {
            pointer.x = e.clientX
            pointer.y = e.clientY
            cursor.classList.add('is-visible')
            dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`
        })
        document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'))
        document.addEventListener('mouseover', e => {
            const target = e.target.closest('a, button, [data-cursor]')
            cursor.classList.toggle('is-link', Boolean(target))
            label.textContent = target && target.dataset.cursor ? target.dataset.cursor : ''
        })
        window.addEventListener('mousedown', () => cursor.classList.add('is-down'))
        window.addEventListener('mouseup', () => cursor.classList.remove('is-down'))

        window.addEventListener('scroll', () => {
            const delta = window.scrollY - lastScroll
            lastScroll = window.scrollY
            if (Math.abs(delta) < 2) return
            cursor.style.setProperty('--dir', delta > 0 ? '0deg' : '180deg')
            cursor.classList.add('is-scroll')
            clearTimeout(scrollTimer)
            scrollTimer = setTimeout(() => cursor.classList.remove('is-scroll'), 650)
        }, { passive: true })

        const followCursor = () => {
            ringX = lerp(ringX, pointer.x, 0.14)
            ringY = lerp(ringY, pointer.y, 0.14)
            ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`
            requestAnimationFrame(followCursor)
        }
        followCursor()
    }

    // Eventos: tira de círculos que avanza en cámara lenta con el scroll
    const reel = document.getElementById('eventos')
    const list = reel ? reel.querySelector('.event-list') : null
    if (!reel || !list || reduced) return

    root.classList.add('reel-on')

    const cards = [...list.querySelectorAll('.event-card')]
    const count = cards.length
    const track = document.getElementById('reel-track')
    const photoBox = document.getElementById('reel-photo')
    const copy = document.getElementById('reel-copy')
    const metaEl = document.getElementById('reel-meta')
    const textEl = document.getElementById('reel-text')
    const noteEl = document.getElementById('reel-note')
    const tagsEl = document.getElementById('reel-tags')
    const numEl = document.getElementById('reel-num')
    const arcEl = document.getElementById('reel-arc')
    const world = document.getElementById('reel-world')
    const ARC = 289.03
    const TRAVEL = 3600
    const PERSPECTIVE = 900
    const pad = n => String(n).padStart(2, '0')

    const events = cards.map(card => {
        const img = card.querySelector('img')
        const bracket = card.querySelector('.desc').textContent.match(/\[[^\]]*\]/)
        return {
            short: card.dataset.short,
            statement: card.dataset.statement,
            meta: card.querySelector('.meta').textContent,
            note: bracket ? bracket[0] : '',
            tags: [...card.querySelectorAll('.tags li')].map(li => li.textContent),
            src: img.getAttribute('src'),
            alt: img.alt
        }
    })

    const arrowSvg = '<svg viewBox="0 0 24 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1 7h21M16 1l6 6-6 6"/></svg>'
    const nodes = []
    const arrows = []
    const photos = []

    events.forEach((ev, i) => {
        const node = document.createElement('div')
        node.className = 'node'
        node.dataset.cursor = 'Ver'
        node.textContent = ev.short
        node.addEventListener('click', () => {
            const span = reel.offsetHeight - window.innerHeight
            const top = reel.getBoundingClientRect().top + window.scrollY + (i / (count - 1)) * span
            window.scrollTo({ top, behavior: 'smooth' })
        })
        track.appendChild(node)
        nodes.push(node)

        if (i < count - 1) {
            const arrow = document.createElement('div')
            arrow.className = 'arrow'
            arrow.innerHTML = arrowSvg
            track.appendChild(arrow)
            arrows.push(arrow)
        }

        const item = document.createElement('div')
        item.className = 'reel-photo-item'
        const media = document.createElement('div')
        media.className = 'media'
        const img = document.createElement('img')
        img.alt = ev.alt
        img.src = ev.src
        const placeholder = document.createElement('span')
        placeholder.className = 'media-ph'
        placeholder.textContent = `Añade aquí la foto: ${ev.src}`
        const mark = () => media.classList.add('no-img')
        img.addEventListener('error', mark)
        media.append(img, placeholder)
        item.appendChild(media)
        photoBox.appendChild(item)
        photos.push(item)
    })

    const random = seeded(7)
    const rings = Array.from({ length: 18 }, (_, i) => {
        const el = document.createElement('div')
        const glow = i % 7 === 3
        el.className = 't-ring' + (glow ? ' glow' : i % 4 === 0 ? ' accent' : '')
        const size = glow ? 70 + random() * 40 : 22 + random() * 58
        el.style.width = `${size}vmin`
        el.style.height = `${size}vmin`
        el.style.margin = `${-size / 2}vmin 0 0 ${-size / 2}vmin`
        world.appendChild(el)
        return {
            el,
            x: (random() - 0.5) * 100,
            y: (random() - 0.5) * 80,
            z: -random() * (TRAVEL + 2600) + 400
        }
    })

    reel.style.height = `${count * 40 + 100}vh`

    let active = -1
    let swapTimer

    const setActive = index => {
        if (index === active) return
        const first = active === -1
        active = index
        nodes.forEach((node, i) => node.classList.toggle('is-active', i === index))
        photos.forEach((item, i) => item.classList.toggle('on', i === index))
        numEl.textContent = pad(index + 1)

        const apply = () => {
            const ev = events[index]
            metaEl.textContent = ev.meta
            textEl.textContent = ev.statement
            noteEl.textContent = ev.note
            tagsEl.innerHTML = ev.tags.map(tag => `<li>${tag}</li>`).join('')
            copy.classList.remove('out')
        }

        clearTimeout(swapTimer)
        if (first) {
            apply()
        } else {
            copy.classList.add('out')
            swapTimer = setTimeout(apply, 220)
        }
    }

    const tilt = { x: 0, y: 0, tx: 0, ty: 0 }
    window.addEventListener('mousemove', e => {
        tilt.tx = (e.clientX / window.innerWidth - 0.5) * 2
        tilt.ty = (e.clientY / window.innerHeight - 0.5) * 2
    })

    let nodeWidth = 0
    let nodeStep = 0
    const measure = () => {
        nodeWidth = nodes[0].offsetWidth
        nodeStep = nodes[1].offsetLeft - nodes[0].offsetLeft
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('load', measure)

    let position = 0

    const render = () => {
        const rect = reel.getBoundingClientRect()
        const span = reel.offsetHeight - window.innerHeight
        const t = clamp(-rect.top / span, 0, 1)
        const visible = rect.bottom > -200 && rect.top < window.innerHeight + 200

        if (visible) {
            // Cada evento se detiene un momento antes de pasar al siguiente
            const raw = t * (count - 1)
            const base = Math.floor(raw)
            const target = base + smooth(0.3, 0.7, raw - base)
            position = Math.abs(target - position) < 0.0004 ? target : lerp(position, target, 0.08)

            if (!nodeStep) measure()
            track.style.transform = `translate3d(${(window.innerWidth / 2 - nodeWidth / 2 - position * nodeStep).toFixed(1)}px, 0, 0)`

            nodes.forEach((node, i) => {
                const distance = Math.abs(i - position)
                node.style.opacity = (1 - 0.78 * smooth(0.2, 2.4, distance)).toFixed(3)
                node.style.transform = `scale(${(1 - 0.1 * smooth(0, 2, distance)).toFixed(3)})`
            })
            arrows.forEach((arrow, i) => {
                arrow.style.opacity = (1 - 0.8 * smooth(0.3, 2.6, Math.abs(i + 0.5 - position))).toFixed(3)
            })

            setActive(clamp(Math.round(position), 0, count - 1))
            arcEl.style.strokeDashoffset = (ARC * (1 - position / (count - 1))).toFixed(2)

            tilt.x = lerp(tilt.x, finePointer ? tilt.tx : 0, 0.06)
            tilt.y = lerp(tilt.y, finePointer ? tilt.ty : 0, 0.06)
            world.style.transform = `rotateX(${(-tilt.y * 2.5).toFixed(3)}deg) rotateY(${(tilt.x * 4).toFixed(3)}deg)`

            const camera = (position / (count - 1)) * TRAVEL
            rings.forEach(ring => {
                const z = camera + ring.z
                const opacity = smooth(-3600, -1400, z) * (1 - smooth(PERSPECTIVE * 0.2, PERSPECTIVE * 0.7, z))
                ring.el.style.opacity = opacity.toFixed(3)
                ring.el.style.transform = `translate3d(${ring.x}vw, ${ring.y}vh, ${z.toFixed(1)}px)`
            })
        }

        requestAnimationFrame(render)
    }
    render()
})()
