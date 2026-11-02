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

    // Túnel: cada evento es una capa que se acerca en 3D al hacer scroll
    const tunnel = document.getElementById('eventos')
    const world = document.getElementById('tunnel-world')
    if (!tunnel || !world || reduced) return

    root.classList.add('tunnel-on')

    const items = [...world.querySelectorAll('.tunnel-item')]
    const hudIndex = document.getElementById('hud-index')
    const hudBar = document.getElementById('hud-bar')
    const GAP = 1200
    const PERSPECTIVE = 900
    const travel = (items.length - 1) * GAP
    const random = seeded(7)

    const rings = Array.from({ length: 21 }, (_, i) => {
        const el = document.createElement('div')
        const glow = i % 7 === 3
        el.className = 't-ring' + (glow ? ' glow' : i % 4 === 0 ? ' accent' : '')
        const size = glow ? 70 + random() * 40 : 22 + random() * 58
        el.style.width = `${size}vmin`
        el.style.height = `${size}vmin`
        el.style.margin = `${-size / 2}vmin 0 0 ${-size / 2}vmin`
        world.prepend(el)
        return {
            el,
            x: (random() - 0.5) * 100,
            y: (random() - 0.5) * 80,
            z: -random() * (travel + 2600) + 400
        }
    })

    tunnel.style.height = `${items.length * 125 + 100}vh`

    const tilt = { x: 0, y: 0, tx: 0, ty: 0 }
    window.addEventListener('mousemove', e => {
        tilt.tx = (e.clientX / window.innerWidth - 0.5) * 2
        tilt.ty = (e.clientY / window.innerHeight - 0.5) * 2
    })

    let progress = 0

    const render = () => {
        const rect = tunnel.getBoundingClientRect()
        const span = tunnel.offsetHeight - window.innerHeight
        const target = clamp(-rect.top / span, 0, 1)
        const active = rect.bottom > -200 && rect.top < window.innerHeight + 200

        if (active) {
            progress = Math.abs(target - progress) < 0.00005 ? target : lerp(progress, target, 0.09)
            tilt.x = lerp(tilt.x, finePointer ? tilt.tx : 0, 0.06)
            tilt.y = lerp(tilt.y, finePointer ? tilt.ty : 0, 0.06)
            world.style.transform = `rotateX(${(-tilt.y * 2.5).toFixed(3)}deg) rotateY(${(tilt.x * 4).toFixed(3)}deg)`

            const camera = progress * travel
            const narrow = window.innerWidth < 768

            items.forEach((el, i) => {
                const z = camera - i * GAP
                const leaving = i === 0 ? [PERSPECTIVE * 0.45, PERSPECTIVE * 0.95] : [PERSPECTIVE * 0.1, PERSPECTIVE * 0.5]
                const opacity = smooth(-GAP * 0.85, -GAP * 0.3, z) * (1 - smooth(leaving[0], leaving[1], z))
                const x = narrow ? 0 : Number(el.dataset.x || 0)
                el.style.opacity = opacity.toFixed(3)
                el.style.visibility = opacity > 0.01 ? 'visible' : 'hidden'
                el.style.transform = `translate3d(calc(-50% + ${x}vw), -50%, ${z.toFixed(1)}px)`
            })

            rings.forEach(ring => {
                const z = camera + ring.z
                const opacity = smooth(-3600, -1400, z) * (1 - smooth(PERSPECTIVE * 0.2, PERSPECTIVE * 0.7, z))
                ring.el.style.opacity = opacity.toFixed(3)
                ring.el.style.transform = `translate3d(${ring.x}vw, ${ring.y}vh, ${z.toFixed(1)}px)`
            })

            const current = clamp(Math.round(camera / GAP), 0, items.length - 1)
            hudIndex.textContent = String(current).padStart(2, '0')
            hudBar.style.transform = `scaleX(${progress.toFixed(4)})`
        }

        requestAnimationFrame(render)
    }
    render()
})()
