window.__ModuleLoader__.load({
  id: 'dsh-layout-memory',
  factory() {
    const KEY = 'dsh.layout-memory.v1'
    const RIGHT_KEY_PREFIX = 'dsh.sidebar-right.v1.'
    const inject = ['layout', 'sidebarRight']

    function apply(ctx) {
      try {
        const layout = ctx.layout
        if (!layout || !layout.panels) return

        const state = (() => {
          try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {} } catch (e) { return {} }
        })()
        const savedRight = typeof state.right === 'number' && state.right >= 300 ? state.right : null
        const rightApi = ctx.sidebarRight

        const save = () => {
          try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (e) { /* ignore quota/security */ }
        }

        const frameEl = () => {
          const anchor = document.querySelector('[data-rightbar-col]') || document.querySelector('[data-shell-overlay]')
          return anchor ? anchor.parentElement : null
        }

        const columns = (frame) => {
          const raw = getComputedStyle(frame).gridTemplateColumns || ''
          return raw.split(/\s+/).map((part) => parseFloat(part)).filter((n) => Number.isFinite(n))
        }

        // Put the remembered widths back through the layout's own actions.
        if (typeof state.left === 'number' && window.innerWidth >= 1024) {
          if (state.left === 0) {
            if (typeof layout.toggleSidebar === 'function') layout.toggleSidebar()
          } else if (state.left >= 264 && typeof layout.panels.setSidebar === 'function') {
            layout.panels.setSidebar(state.left)
          }
        }
        if (savedRight !== null && typeof layout.panels.setRightbar === 'function') {
          layout.panels.setRightbar(savedRight)
        }

        // Restore the right panel's open state once, after the on-screen session adopts
        // its own dock layout. A session that never used the panel keeps its default.
        let rightRestoreDone = state.rightOpen !== true
        let rightRestoreStartedAt = 0
        const sessionUsedRightPanel = (sessionId) => {
          try { return localStorage.getItem(RIGHT_KEY_PREFIX + sessionId) !== null } catch (e) { return false }
        }
        const enforceRightOpen = () => {
          if (rightRestoreDone) return
          const activeView = document.querySelector('[data-sidebar-right-session]:not([hidden])')
          const sessionId = activeView ? activeView.getAttribute('data-sidebar-right-session') : null
          if (!sessionId) return
          if (!rightApi || typeof rightApi.isExpanded !== 'function' || typeof rightApi.toggleExpanded !== 'function') {
            rightRestoreDone = true
            return
          }
          let expanded
          try { expanded = rightApi.isExpanded() === true } catch (e) { return }
          if (!rightRestoreStartedAt) rightRestoreStartedAt = Date.now()
          if (expanded) { rightRestoreDone = true; return }
          if (!sessionUsedRightPanel(sessionId)) { rightRestoreDone = true; return }
          if (Date.now() - rightRestoreStartedAt < 2500) return
          try { rightApi.toggleExpanded() } catch (e) { return }
          rightRestoreDone = true
        }

        // Keep the remembered right width in force until the user drags its handle:
        // re-apply it whenever the panel is open with enough room, so a failed or
        // superseded restore still converges. A user drag hands control back.
        let userAdjustedRight = false
        ctx.effect(() => {
          const onPointerDown = (event) => {
            try {
              const target = event.target
              if (target && typeof target.closest === 'function' && target.closest('[data-side="rightbar"]')) {
                userAdjustedRight = true
              }
            } catch (e) { }
          }
          document.addEventListener('pointerdown', onPointerDown, true)
          return () => document.removeEventListener('pointerdown', onPointerDown, true)
        }, 'layout-memory: right drag tracking')

        const enforceRightWidth = (cols, open, available) => {
          if (userAdjustedRight || !open || savedRight === null) return
          if (cols.length < 3 || available < savedRight - 2) return
          const right = Math.round(cols[2])
          if (Math.abs(right - savedRight) <= 2) return
          if (typeof layout.panels.setRightbar === 'function') layout.panels.setRightbar(savedRight)
        }

        const tick = () => {
          if (document.hidden) return
          enforceRightOpen()
          const frame = frameEl()
          if (!frame) return
          const cols = columns(frame)
          if (cols.length < 2) return
          const drawer = frame.hasAttribute('data-sidebar-drawer')
          const rightCollapsed = frame.hasAttribute('data-rightbar-collapsed')
          const rightFullscreen = frame.hasAttribute('data-rightbar-fullscreen')
          const open = !rightCollapsed || rightFullscreen
          const frameWidth = Math.round(frame.getBoundingClientRect().width)
          const leftCol = cols[0] <= 1 ? 0 : Math.round(cols[0])
          const available = frameWidth - leftCol - 400
          let changed = false

          enforceRightWidth(cols, open && !rightFullscreen, available)

          if (!drawer && window.innerWidth >= 1024) {
            if (leftCol !== state.left) { state.left = leftCol; changed = true }
            if (rightRestoreDone && open !== state.rightOpen) { state.rightOpen = open; changed = true }
          }
          // The remembered width stays in force until the user drags the handle; only a
          // user drag becomes a new preference. Never record a space-squeezed value, so a
          // narrow window cannot overwrite a wider remembered width.
          if (userAdjustedRight && !rightCollapsed && !rightFullscreen && cols.length > 2) {
            const right = Math.round(cols[2])
            const squeezed = right >= available - 2
            if (right > 0 && !squeezed && right !== state.right) { state.right = right; changed = true }
          }
          if (changed) save()
        }

        ctx.effect(() => {
          const timer = setInterval(tick, 1000)
          return () => clearInterval(timer)
        }, 'layout-memory: width and panel polling')
      } catch (e) {
        console.warn('[layout-memory] disabled:', e)
      }
    }

    return { inject, apply }
  },
})
