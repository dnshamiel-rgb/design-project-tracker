/* Read-only meeting view. Uses shared tracker records; never reads private rooms. */
(() => {
    'use strict';
    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const list = value => Array.isArray(value) ? value : [];
    const dateKey = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value ? value : '';
    const today = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const formatDate = value => dateKey(value) ? new Date(value + 'T12:00:00+08:00').toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kuala_Lumpur'}) : 'No date set';
    const owner = task => task.mainPIC || list(task.assigned).join(', ') || 'PIC not assigned';
    const chapter = task => typeof getTaskChapter === 'function' ? getTaskChapter(task) : task.chapter || 'Unassigned';
    const dueOrder = (a, b) => (dateKey(a.deadline) || '9999').localeCompare(dateKey(b.deadline) || '9999');
    let dialog, slides = [], slideIndex = 0, snapshot, returnFocus, inertElements = [], previousOverflow;
    let tasksLoaded = false;
    window.addEventListener('tracker-tasks-synced', () => { tasksLoaded = true; });
    const empty = text => `<div class="pm-empty">${esc(text)}</div>`;
    const pill = (text, tone = '') => `<span class="pm-pill ${tone}">${esc(text)}</span>`;
    const chunks = (items, size) => items.length ? Array.from({length:Math.ceil(items.length / size)}, (_, i) => items.slice(i * size, (i + 1) * size)) : [[]];
    function taskRow(task, extra = '') {
        const overdue = dateKey(task.deadline) && task.deadline < snapshot.today && task.status !== 'Done';
        return `<article class="pm-row"><div><h3>${esc(task.name || 'Untitled task')}</h3><p>${esc(chapter(task))} · ${esc(owner(task))}</p>${extra}</div><div class="pm-row-side">${pill(task.status || 'Not Started', task.status === 'Blocked' ? 'pm-danger' : '')}<span class="${overdue ? 'pm-overdue' : ''}">${overdue ? 'Overdue · ' : ''}${esc(formatDate(task.deadline))}</span></div></article>`;
    }
    function capture() {
        // Freeze records during a presentation so remote edits cannot move slides unexpectedly.
        snapshot = JSON.parse(JSON.stringify({
            tasks: typeof tasks !== 'undefined' ? list(tasks) : [],
            meetings: typeof meetings !== 'undefined' ? list(meetings) : [],
            chapters: typeof CHAPTERS !== 'undefined' ? CHAPTERS : [],
            reviews: typeof chapterReviews !== 'undefined' ? chapterReviews : {},
            reviewFlow: typeof SV_REVIEW_FLOW !== 'undefined' ? SV_REVIEW_FLOW : [],
            today: today(), capturedAt: new Date().toLocaleTimeString('en-GB', {timeZone:'Asia/Kuala_Lumpur',hour:'2-digit',minute:'2-digit'})
        }));
        const all = snapshot.tasks, active = all.filter(t => t.status !== 'Done');
        const next = active.filter(t => dateKey(t.deadline) && t.deadline >= snapshot.today).sort(dueOrder)[0];
        const upcoming = snapshot.meetings.filter(m => dateKey(m.date) && m.date >= snapshot.today).sort((a,b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))[0];
        const overdue = active.filter(t => dateKey(t.deadline) && t.deadline < snapshot.today).length;
        slides = [{section:0, title:'Project overview', subtitle:'A shared view of the work ahead.', html:`
            <div class="pm-stats"><div><strong>${all.length - active.length}</strong><span>Tasks done</span></div><div><strong>${active.length}</strong><span>Tasks open</span></div><div><strong>${overdue}</strong><span>Tasks overdue</span></div><div><strong>${active.filter(t=>t.status === 'Blocked').length}</strong><span>Tasks blocked</span></div></div>
            <div class="pm-grid"><article class="pm-card pm-feature"><span class="pm-label">NEXT TASK DEADLINE</span><h3>${esc(next ? next.name : 'No upcoming deadline recorded')}</h3><p>${esc(next ? formatDate(next.deadline) + ' · ' + owner(next) : 'Add deadlines to tasks to plan the next delivery.')}</p></article><article class="pm-card"><span class="pm-label">NEXT SCHEDULED MEETING</span><h3>${esc(upcoming ? upcoming.title : 'No upcoming meeting recorded')}</h3><p>${esc(upcoming ? formatDate(upcoming.date) + (upcoming.time ? ' · ' + upcoming.time : '') : 'Schedule the next review in Meetings.')}</p></article></div>
            <p class="pm-note">Task counts reflect recorded statuses, not overall engineering completion.${!tasksLoaded && !all.length ? ' Task data has not synced yet; refresh after syncing.' : ''}</p>`}];
        const groups = new Map(snapshot.chapters.map(c => [c, []]));
        all.forEach(t => {const c = chapter(t); if (!groups.has(c)) groups.set(c, []); groups.get(c).push(t);});
        chunks([...groups], 4).forEach((entries, page, pages) => slides.push({section:1,title:'Progress by chapter',subtitle:`Chapter status and responsibility · ${page+1} / ${pages.length}`,html:entries.map(([name, records]) => {
            const done = records.filter(t=>t.status === 'Done').length;
            const status = snapshot.reviews[name]?.status;
            const review = snapshot.reviewFlow.find(r=>r.key === status)?.label || 'Not recorded';
            const people = [...new Set(records.map(owner))].join(' · ') || 'No tasks assigned';
            return `<article class="pm-chapter"><div class="pm-chapter-top"><h3>${esc(name)}</h3>${pill('SV review: ' + review)}</div><p>${esc(people)}</p><div class="pm-track" aria-hidden="true"><span style="width:${records.length ? done / records.length * 100 : 0}%"></span></div><div class="pm-chapter-meta"><strong>${done} / ${records.length} tasks done</strong><span>${records.filter(t=>t.status === 'In Progress').length} in progress · ${records.filter(t=>t.status === 'Blocked').length} blocked</span></div></article>`;
        }).join('') || empty('No chapters recorded.')}));
        const issues = active.filter(t=>t.status === 'Blocked').sort(dueOrder).map(t => taskRow(t, '<p class="pm-note">Blocker reason and required decision: confirm during discussion.</p>'));
        Object.entries(snapshot.reviews).filter(([,r])=>r.status === 'revision').forEach(([name]) => issues.push(`<article class="pm-row"><div><h3>${esc(name)}</h3><p>Recorded supervisor review status requires revision.</p></div>${pill('Revision', 'pm-danger')}</article>`));
        const minutes = snapshot.meetings.filter(m=>m.mom?.summary && dateKey(m.date) && m.date <= snapshot.today).sort((a,b)=>b.date.localeCompare(a.date))[0];
        chunks(issues, 4).forEach((items, page, pages) => slides.push({section:2,title:'Issues & decisions',subtitle:`Recorded blockers and revision requests · ${page+1} / ${pages.length}`,html:items.join('') || empty('No blocked tasks or chapter revisions recorded. This does not confirm that there are no issues.')}));
        if (minutes) slides.push({section:2,title:'Latest meeting notes',subtitle:`${minutes.title || 'Meeting'} · ${formatDate(minutes.date)}`,html:`<article class="pm-card"><span class="pm-label">RECORDED MINUTES</span><p class="pm-minutes">${esc(minutes.mom.summary)}</p></article><p class="pm-note">Meeting notes are shown as recorded; decisions are not inferred automatically.</p>`});
        const actions = active.slice().sort(dueOrder).map(t=>taskRow(t));
        snapshot.meetings.forEach(m => list(m.mom?.actionItems).filter(item => !item.done && !all.some(t=>item.taskId != null && String(t.id) === String(item.taskId))).forEach(item => actions.push(`<article class="pm-row"><div><h3>${esc(item.text || 'Untitled action')}</h3><p>${esc(item.owner || 'PIC not assigned')} · Minutes: ${esc(m.title || 'Meeting')}</p></div><div class="pm-row-side">${pill('Meeting action')}<span>No deadline recorded</span></div></article>`)));
        chunks(actions, 5).forEach((items, page, pages) => slides.push({section:3,title:'Next actions',subtitle:`Open tasks ordered by deadline, followed by unlinked meeting actions · ${page+1} / ${pages.length}`,html:items.join('') || empty('No open tasks or meeting actions recorded.')}));
        slideIndex = Math.min(slideIndex, slides.length - 1);
        render();
    }
    function render() {
        const slide = slides[slideIndex];
        dialog.querySelector('#pm-title').textContent = slide.title;
        dialog.querySelector('#pm-subtitle').textContent = slide.subtitle;
        const content = dialog.querySelector('#pm-content');
        content.innerHTML = slide.html;
        content.scrollTop = 0;
        dialog.querySelector('#pm-count').textContent = `${slideIndex + 1} / ${slides.length}`;
        dialog.querySelector('#pm-snapshot').textContent = `Snapshot · ${formatDate(snapshot.today)} · ${snapshot.capturedAt} MYT`;
        dialog.querySelector('#pm-prev').disabled = slideIndex === 0;
        dialog.querySelector('#pm-next').disabled = slideIndex === slides.length - 1;
        dialog.querySelectorAll('[data-pm-section]').forEach(button => button.setAttribute('aria-current', Number(button.dataset.pmSection) === slide.section ? 'step' : 'false'));
    }
    function move(delta) {slideIndex = Math.max(0, Math.min(slides.length - 1, slideIndex + delta)); render();}
    async function fullscreen() {
        try {
            if (document.fullscreenElement === dialog) await document.exitFullscreen();
            else if (dialog.requestFullscreen) await dialog.requestFullscreen();
            else dialog.querySelector('#pm-snapshot').textContent = 'Fullscreen unavailable. Presentation remains open.';
        } catch (_) {dialog.querySelector('#pm-snapshot').textContent = 'Fullscreen unavailable. Presentation remains open.';}
    }
    function close() {
        if (dialog.hidden) return;
        if (document.fullscreenElement === dialog) document.exitFullscreen().catch(()=>{});
        dialog.hidden = true;
        inertElements.forEach(([element, previous]) => {element.inert = previous;});
        inertElements = [];
        document.body.style.overflow = previousOverflow;
        if (returnFocus?.isConnected) returnFocus.focus();
    }
    function open() {
        const login = document.getElementById('loginScreen');
        if (!dialog.hidden || (login && !login.classList.contains('hidden'))) return;
        returnFocus = document.activeElement;
        previousOverflow = document.body.style.overflow;
        slideIndex = 0;
        capture();
        dialog.hidden = false;
        inertElements = [...document.body.children].filter(el=>el !== dialog && !['SCRIPT','STYLE','LINK'].includes(el.tagName)).map(el=>[el,el.inert]);
        inertElements.forEach(([el]) => {el.inert = true;});
        document.body.style.overflow = 'hidden';
        dialog.querySelector('#pm-close').focus();
        fullscreen();
    }
    function init() {
        const header = document.querySelector('.header-actions');
        if (!header) return;
        const launch = document.createElement('button');
        launch.type = 'button'; launch.id = 'presentationBtn'; launch.className = 'pm-launch';
        launch.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="13" rx="2"/><path d="M12 16v5m-4 0h8M10 7l5 3-5 3z"/></svg><span>Present</span>';
        launch.addEventListener('click', open); header.prepend(launch);
        dialog = document.createElement('section'); dialog.id = 'presentationMode'; dialog.hidden = true;
        dialog.setAttribute('role','dialog'); dialog.setAttribute('aria-modal','true'); dialog.setAttribute('aria-labelledby','pm-title');
        dialog.innerHTML = `<header class="pm-top"><div class="pm-brand"><span>DP</span><div>DESIGN PROJECT<small>Team progress review</small></div></div><div class="pm-tools"><button type="button" id="pm-refresh">Refresh data</button><button type="button" id="pm-fullscreen">Fullscreen</button><button type="button" id="pm-close">Exit <span aria-hidden="true">×</span></button></div></header><nav class="pm-nav" aria-label="Presentation sections">${['Overview','Chapters','Issues & decisions','Next actions'].map((title,i)=>`<button type="button" data-pm-section="${i}"><span>0${i+1}</span>${title}</button>`).join('')}</nav><div class="pm-heading"><h2 id="pm-title"></h2><p id="pm-subtitle"></p></div><main id="pm-content" tabindex="0" aria-label="Slide content"></main><footer class="pm-footer"><span id="pm-snapshot"></span><div><span class="pm-key-help">← → navigate · Esc exit</span><button type="button" id="pm-prev" aria-label="Previous slide">←</button><span id="pm-count" aria-live="polite"></span><button type="button" id="pm-next" aria-label="Next slide">→</button></div></footer>`;
        document.body.appendChild(dialog);
        dialog.querySelector('#pm-close').onclick = close;
        dialog.querySelector('#pm-refresh').onclick = capture;
        dialog.querySelector('#pm-fullscreen').onclick = fullscreen;
        dialog.querySelector('#pm-prev').onclick = ()=>move(-1);
        dialog.querySelector('#pm-next').onclick = ()=>move(1);
        dialog.querySelectorAll('[data-pm-section]').forEach(button=>button.onclick=()=>{slideIndex=slides.findIndex(s=>s.section === Number(button.dataset.pmSection));render();});
        document.addEventListener('keydown', event => {
            if (dialog.hidden) return;
            if (event.key === 'Escape') {event.preventDefault();close();}
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {event.preventDefault();move(event.key === 'ArrowRight' ? 1 : -1);}
            if (event.key === 'Tab') {
                const focusable = [...dialog.querySelectorAll('button:not(:disabled),[tabindex="0"]')];
                const first = focusable[0], last = focusable[focusable.length-1];
                if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
                else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
            }
        });
        // Authentication UI changes must not leave a presentation visible after sign-out.
        const login = document.getElementById('loginScreen');
        if (login) new MutationObserver(()=>{if (!login.classList.contains('hidden')) close();}).observe(login,{attributes:true,attributeFilter:['class']});
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
