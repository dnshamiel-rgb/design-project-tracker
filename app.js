// ============================================================
// DESIGN PROJECT II TRACKER
// FULL JAVASCRIPT
// ============================================================



// ============================================================
// TOAST NOTIFICATIONS (replaces native showToast())
// ============================================================

function getToastContainer() {

    let container = document.getElementById("toastContainer");

    if (!container) {

        container = document.createElement("div");

        container.id = "toastContainer";

        container.className = "toast-container";

        document.body.appendChild(container);

    }

    return container;

}


function showToast(message, type) {

    const text = String(message ?? "");

    let resolvedType = type;

    if (!resolvedType) {

        if (/^\s*❌/.test(text) || /failed|error/i.test(text)) {

            resolvedType = "error";

        }

        else if (/only |cannot |please |not authorized|view-only|not configured|not ready|already been handled/i.test(text)) {

            resolvedType = "warning";

        }

        else {

            resolvedType = "success";

        }

    }

    const icons = {
        success: "✅",
        error: "❌",
        warning: "⚠️"
    };

    const container = getToastContainer();

    const toast = document.createElement("div");

    toast.className = "toast toast-" + resolvedType;

    toast.innerHTML = `
        <span class="toast-icon">${icons[resolvedType] || "ℹ️"}</span>
        <span class="toast-text"></span>
        <button type="button" class="toast-close" aria-label="Dismiss">×</button>
    `;

    toast.querySelector(".toast-text").textContent =
        text.replace(/^\s*❌\s*/, "");

    function remove() {

        toast.classList.add("toast-hide");

        setTimeout(() => toast.remove(), 200);

    }

    toast.querySelector(".toast-close").addEventListener("click", remove);

    container.appendChild(toast);

    setTimeout(remove, resolvedType === "error" ? 6000 : 4000);

}


// ============================================================
// EMAILJS SETTINGS
// ============================================================
//
// NANTI ISI 3 MAKLUMAT EMAILJS DI SINI
//
// Public Key
// Service ID
// Template ID
//
// ============================================================

const EMAILJS_PUBLIC_KEY =
    "JQlJoeOCxBWi9WcxX";

const EMAILJS_SERVICE_ID =
    "service_3bjh8zh";

const EMAILJS_TEMPLATE_ID =
    "template_s3juinp";


// ============================================================
// TEAM MEMBERS
// ============================================================

const members = [

    {
        name: "Shamiel",
        email: "2023305361@student.uitm.edu.my"
    },

    {
        name: "Hamizan",
        email: "2023126973@student.uitm.edu.my"
    },

    {
        name: "Aisyah",
        email: "2024901861@student.uitm.edu.my"
    },

    {
        name: "Aina",
        email: "2023189595@student.uitm.edu.my"
    },

    {
        name: "Aziemah",
        email: "2022496438@student.uitm.edu.my"
    }

];


// ============================================================
// LECTURER / SUPERVISOR ACCOUNT (VIEW-ONLY ACCESS)
// ============================================================
//
// Berasingan daripada 5 ahli group. Lecturer log masuk menggunakan
// akaun Firebase sendiri, dan cuma nampak Dashboard, Tasks, Calendar
// dan Resources. Tasks & Resources jadi view-only (tak boleh
// tambah/edit/delete). Calendar tetap boleh diedit.
//
// PENTING: Gantikan e-mel placeholder di bawah dengan e-mel pensyarah.
// ============================================================

const LECTURER_NAME = "Lecturer";

const LECTURER = {
    name: LECTURER_NAME,
    email: "meorhafiz7767@uitm.edu.my"
};


// ============================================================
// GROUP LEADER (special account — extra permissions)
// ============================================================
//
// One member is the Group Leader. Everyone can still add and
// edit tasks/meetings/resources as usual, but ONLY the leader
// can delete them — this prevents accidental data loss and
// keeps one person accountable for what stays/goes.
//
// PENTING: Tukar nama di bawah kalau leader group bertukar.
// Nama mesti sama PERSIS macam dalam senarai `members` di atas.
// ============================================================

const LEADER_NAME = "Shamiel";
// Separate ChemDesign engineering application launched from the Engineering tab.
const HEAT_EXCHANGER_TOOL_URL =
    "https://chemdesign-heat-exchanger.onrender.com";


function renderEngineeringToolAccess() {

    const button = getElement("heatExchangerToolBtn");
    const badge = getElement("heatExchangerAccessBadge");
    const note = getElement("heatExchangerAccessNote");

    if (!button) return;

    const allowed = isGroupLeader();

    button.disabled = !allowed;
    button.classList.toggle("locked", !allowed);
    button.textContent = allowed
        ? "Open Workspace ↗"
        : "🔒 Leader Access";

    if (badge) {
        badge.textContent = allowed ? "LEADER ACCESS" : "LOCKED";
        badge.classList.toggle("locked", !allowed);
    }

    if (note) {
        note.textContent = allowed
            ? "Opens ChemDesign in a new tab"
            : `Only ${LEADER_NAME} can open this workspace`;
    }
}


function openHeatExchangerTool() {

    if (!isGroupLeader()) {

        showToast(
            `Only ${LEADER_NAME} can open the Heat Exchanger workspace.`,
            "warning"
        );

        renderEngineeringToolAccess();
        return;
    }

    window.open(
        HEAT_EXCHANGER_TOOL_URL,
        "_blank",
        "noopener,noreferrer"
    );
}


function isGroupLeader() {

    return getCurrentUser() === LEADER_NAME;

}


// ============================================================
// FIREBASE SETTINGS
// ============================================================
//
// NANTI ISI firebaseConfig DI SINI (dari Firebase Console)
//
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyBws5ukLd5cZThPFjJsLr45AIGzA_QRgbs",
    authDomain: "design-project-dashboard.firebaseapp.com",
    projectId: "design-project-dashboard",
    storageBucket: "design-project-dashboard.firebasestorage.app",
    messagingSenderId: "548670649024",
    appId: "1:548670649024:web:c902164e90a1c3a6dc7325"
};


// ============================================================
// GOOGLE SHEET BACKUP (safety-net mirror — Tasks & Resources)
// ============================================================
//
// Every time tasks/resources are saved to Firestore, a snapshot
// is also fire-and-forget POSTed to a Google Apps Script Web App,
// which mirrors the current list into a Google Sheet. This is a
// backup only — Firestore remains the source of truth the app
// reads from. If this fails (offline, script down), the app
// keeps working normally; only the backup mirror is skipped.
// ============================================================

const GOOGLE_SHEET_BACKUP_URL =
    "https://script.google.com/macros/s/AKfycby0d6e3KBplHy6tgSyXulyBfWVH8s5O1C1KZ7dKTRumvVQ67Pnt02yKJx2KwiYK5K3_/exec";


function syncBackupToSheet(type, data) {

    if (
        !GOOGLE_SHEET_BACKUP_URL ||
        GOOGLE_SHEET_BACKUP_URL.startsWith("YOUR_")
    ) {

        return;

    }

    // "no-cors" is required because Apps Script Web Apps don't return
    // CORS headers the browser can read. The request still goes
    // through and the script still runs — we just can't read the
    // response, which is fine since this is a fire-and-forget backup.
    fetch(GOOGLE_SHEET_BACKUP_URL, {

        method: "POST",

        mode: "no-cors",

        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },

        body: JSON.stringify({ type: type, data: data })

    }).catch(error => {

        console.error("Sheet backup sync failed (safe to ignore):", error);

    });

}


let db = null;

let storage = null;

let auth = null;

let functionsInstance = null;

let firebaseReady = false;

let dataListenersStarted = false;

function initFirebase() {

    if (
        firebaseReady
    ) {

        return;

    }

    if (
        typeof firebase === "undefined"
    ) {

        return;

    }

    if (
        firebaseConfig.apiKey ===
        "YOUR_API_KEY"
    ) {

        setSyncStatus(
            false,
            "Not configured"
        );

        return;

    }

    try {

        firebase.initializeApp(
            firebaseConfig
        );

        db =
            firebase.firestore();

        storage =
            firebase.storage();

        auth =
            firebase.auth();

        functionsInstance =
            (typeof firebase.functions === "function")
                ? firebase.functions()
                : null;

        firebaseReady = true;

        setSyncStatus(
            false,
            "Sign in required"
        );

        auth.onAuthStateChanged(handleAuthStateChanged);

    }

    catch (error) {

        console.error(
            "Firebase init failed:",
            error
        );

        setSyncStatus(
            false,
            "Connection failed"
        );

    }

}


function setSyncStatus(
    online,
    text
) {

    const dot =
        document.querySelector(
            "#syncStatus .sync-dot"
        );

    const label =
        getElement(
            "syncStatusText"
        );

    if (dot) {

        dot.classList.toggle(
            "offline",
            !online
        );

    }

    if (label) {

        label.textContent = text;

    }

}


// ============================================================
// LOAD TASKS (real-time from Firestore)
// ============================================================

let tasks = [];


function listenToTasks() {

    if (!db) {
        return;
    }

    db.collection(
        "trackerData"
    )
        .doc(
            "tasks"
        )
        .onSnapshot(
            doc => {

                if (
                    doc.exists
                ) {

                    tasks =
                        sanitizeStoredData(doc.data().list) ||
                        [];

                }

                else {

                    tasks = [];

                }

                window.observeSavedTasks(tasks);
                window.dispatchEvent(new CustomEvent('tracker-tasks-synced', { detail: tasks }));

                updateEquipmentFilterOptions();

                updateDashboard();

                renderTasks();

                renderTeam();

                renderCalendar();

                renderKanban();

                renderMyDay();

                checkEmailReminders();

                syncBackupToSheet("tasks", tasks);

            },
            error => {

                console.error(
                    "Tasks sync error:",
                    error
                );

                setSyncStatus(
                    false,
                    "Sync error"
                );

            }
        );

}


// ============================================================
// SAVE DATA
// ============================================================

function saveData() {
    return window.persistTaskChanges(tasks);
}

// ============================================================
// LOAD MEETINGS (real-time from Firestore)
// ============================================================

let meetings = [];


function listenToMeetings() {

    if (!db) {
        return;
    }

    db.collection(
        "trackerData"
    )
        .doc(
            "meetings"
        )
        .onSnapshot(
            doc => {

                if (
                    doc.exists
                ) {

                    meetings =
                        sanitizeStoredData(doc.data().list) ||
                        [];

                }

                else {

                    meetings = [];

                }

                renderMeetings();

                renderCalendar();

                renderMyDay();

                renderChapterProgress();

            },
            error => {

                console.error(
                    "Meetings sync error:",
                    error
                );

            }
        );

}


function saveMeetingsData() {

    if (!db) {

        showToast(
            "Firebase not configured yet — changes won't be saved. Ask the project owner to set up Firebase."
        );

        return;

    }

    db.collection(
        "trackerData"
    )
        .doc(
            "meetings"
        )
        .set({
            list: meetings
        })
        .catch(
            error => {

                console.error(
                    "Save meetings failed:",
                    error
                );

                showToast(
                    "❌ Save failed: " +
                    error.message +
                    "\n\nCheck Firestore Rules — the passcode may not match, or check your internet connection."
                );

            }
        );

}


// ============================================================
// RESOURCES (Chapter 1-10 file/link repository)
// ============================================================

const CHAPTERS = [

    "Chapter 1",
    "Chapter 2",
    "Chapter 3",
    "Chapter 4",
    "Chapter 5",
    "Chapter 6",
    "Chapter 7",
    "Chapter 8",
    "Chapter 9",
    "Chapter 10"

];

// Resources can have extra user-created sections (e.g. Chapter 11, Appendix).
// Keep CHAPTERS fixed because it is also used by the task / SV workflow.
// resourceSectionOrder controls display order on the Resources page only.
let customResourceSections = [];
let resourceSectionOrder = [];

function normalizeCustomResourceSections(value) {

    const raw = Array.isArray(value) ? value : [];
    const seen = new Set(CHAPTERS.map(item => item.toLowerCase()));
    const cleaned = [];

    raw.forEach(item => {

        const name = sanitizeText(item).slice(0, 60);
        const key = name.toLowerCase();

        if (!name || seen.has(key)) return;

        seen.add(key);
        cleaned.push(name);

    });

    return cleaned;

}

function normalizeResourceSectionOrder(value, availableSections) {

    const available = Array.isArray(availableSections)
        ? availableSections
        : [];

    const availableMap = new Map(
        available.map(section => [section.toLowerCase(), section])
    );

    const seen = new Set();
    const ordered = [];

    (Array.isArray(value) ? value : []).forEach(item => {

        const name = sanitizeText(item);
        const key = name.toLowerCase();
        const canonical = availableMap.get(key);

        if (!canonical || seen.has(key)) return;

        seen.add(key);
        ordered.push(canonical);

    });

    available.forEach(section => {

        const key = section.toLowerCase();

        if (!seen.has(key)) {
            seen.add(key);
            ordered.push(section);
        }

    });

    return ordered;

}


function getResourceSections() {

    const available = [
        ...CHAPTERS,
        ...normalizeCustomResourceSections(customResourceSections)
    ];

    resourceSectionOrder =
        normalizeResourceSectionOrder(resourceSectionOrder, available);

    return [...resourceSectionOrder];

}


const TASK_CHAPTER_OPTIONS = [
    "Unassigned",
    "General / Not Chapter Specific",
    ...CHAPTERS
];


function getTaskChapter(task) {

    const chapter = sanitizeText(task && task.chapter ? task.chapter : "");

    return TASK_CHAPTER_OPTIONS.includes(chapter)
        ? chapter
        : "Unassigned";

}


function getTaskWorkPackage(task) {

    return sanitizeText(task && task.workPackage ? task.workPackage : "");

}


const GENERAL_CHAPTER_PACKAGE_KEY = "__GENERAL_CHAPTER_TASKS__";
const GENERAL_CHAPTER_PACKAGE_LABEL = "General Chapter Tasks";


function getTaskPackageKey(task) {

    return getTaskWorkPackage(task) || GENERAL_CHAPTER_PACKAGE_KEY;

}


// ============================================================
// PHASE 2 — SV REVIEW CYCLE (per chapter)
// ============================================================

const SV_REVIEW_FLOW = [
    { key: "working", label: "Working" },
    { key: "ready_for_sv", label: "Ready for SV" },
    { key: "submitted", label: "Submitted" },
    { key: "f2f_reviewed", label: "F2F Reviewed" },
    { key: "revision", label: "Revision" },
    { key: "approved", label: "Approved" }
];

let chapterReviews = {};


function getSvReviewMeta(status) {

    return SV_REVIEW_FLOW.find(item => item.key === status) || SV_REVIEW_FLOW[0];

}


function getChapterSvStatus(chapter) {

    const record = chapterReviews[chapter] || {};
    const status = sanitizeText(record.status || "working");

    return SV_REVIEW_FLOW.some(item => item.key === status)
        ? status
        : "working";

}


function listenToChapterReviews() {

    if (!db) return;

    db.collection("trackerData")
        .doc("chapterReviews")
        .onSnapshot(
            doc => {

                chapterReviews = doc.exists
                    ? (sanitizeStoredData(doc.data().map) || {})
                    : {};

                renderChapterProgress();

            },
            error => {
                console.error("Chapter SV review sync error:", error);
            }
        );

}


function saveChapterReviewsData() {

    if (!db) return;

    db.collection("trackerData")
        .doc("chapterReviews")
        .set({ map: chapterReviews })
        .catch(error => {
            console.error("Save chapter SV review failed:", error);
            showToast("❌ SV review status failed to save: " + error.message);
        });

}


function setChapterSvStatus(chapter, status) {

    if (isLecturer()) {
        showToast("View-only access — lecturer cannot change the group SV review status.");
        renderChapterProgress();
        return;
    }

    if (!CHAPTERS.includes(chapter)) return;

    const validStatus = SV_REVIEW_FLOW.some(item => item.key === status)
        ? status
        : "working";

    chapterReviews[chapter] = {
        ...(chapterReviews[chapter] || {}),
        status: validStatus,
        updatedBy: getCurrentUser() || "Unknown",
        updatedAt: new Date().toISOString()
    };

    saveChapterReviewsData();
    renderChapterProgress();

    const meta = getSvReviewMeta(validStatus);
    logActivity(`updated ${chapter} SV review status to ${meta.label}`);
    showToast(`${chapter} SV status: ${meta.label}`);

}


function renderSvReviewSteps(status) {

    const currentIndex = Math.max(
        0,
        SV_REVIEW_FLOW.findIndex(item => item.key === status)
    );

    return SV_REVIEW_FLOW.map((item, index) => {

        const cls = index < currentIndex
            ? "complete"
            : index === currentIndex
                ? "current"
                : "";

        return `
            <div class="sv-review-step ${cls}">
                <span>${index < currentIndex ? "✓" : index + 1}</span>
                <small>${item.label}</small>
            </div>
        `;

    }).join("");

}


function getLinkedChapterMeeting(chapter) {

    const linked = meetings
        .filter(meeting => sanitizeText(meeting.relatedChapter || "") === chapter)
        .sort((a, b) =>
            `${a.date || ""}T${a.time || "00:00"}`.localeCompare(
                `${b.date || ""}T${b.time || "00:00"}`
            )
        );

    if (!linked.length) return null;

    const today = formatDate(new Date());
    const upcoming = linked.find(meeting => (meeting.date || "") >= today);

    return upcoming || linked[linked.length - 1];

}


function renderLinkedMeetingSummary(chapter) {

    const meeting = getLinkedChapterMeeting(chapter);

    if (!meeting) {
        return `
            <div class="sv-linked-meeting empty">
                <div>
                    <span>🗓️ No SV/F2F meeting linked</span>
                    <small>Link the next supervisor review meeting to this chapter.</small>
                </div>
                <button
                    type="button"
                    class="sv-link-meeting-btn"
                    onclick="openMeetingForChapter('${chapter}')"
                    ${isLecturer() ? "disabled" : ""}
                >
                    + Link Meeting
                </button>
            </div>
        `;
    }

    const equipment = sanitizeText(meeting.relatedWorkPackage || "");

    return `
        <button
            type="button"
            class="sv-linked-meeting"
            onclick="editMeeting(${meeting.id})"
        >
            <span>🗓️ ${meeting.title}</span>
            <small>${meeting.date || "No date"}${meeting.time ? " · " + meeting.time : ""}${equipment ? " · " + equipment : ""}</small>
        </button>
    `;

}


function openMeetingForChapter(chapter) {

    if (!CHAPTERS.includes(chapter)) return;

    showSection("meetings");

    openMeetingModal(null, {
        relatedChapter: chapter
    });

}


function getEquipmentOwner(packageTasks) {

    const counts = {};

    packageTasks.forEach(task => {

        const name = task.mainPIC || "";

        if (!name) return;

        counts[name] = (counts[name] || 0) + 1;

    });

    const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1]);

    return sorted.length ? sorted[0][0] : "-";

}


function getEquipmentStatus(packageTasks) {

    if (!packageTasks.length) {
        return { label: "Not Started", cls: "not-started" };
    }

    const allDone = packageTasks.every(task => task.status === "Done");

    if (allDone) {
        return { label: "Ready", cls: "ready" };
    }

    const hasStarted = packageTasks.some(task =>
        Number(task.progress || 0) > 0 ||
        task.status === "In Progress" ||
        task.status === "Blocked"
    );

    return hasStarted
        ? { label: "In Progress", cls: "in-progress" }
        : { label: "Not Started", cls: "not-started" };

}


function getAverageTaskProgress(taskList) {

    if (!taskList.length) return 0;

    return Math.round(
        taskList.reduce(
            (sum, task) => sum + Number(task.progress || 0),
            0
        ) / taskList.length
    );

}


function updateEquipmentFilterOptions() {

    const select = getElement("filterEquipment");

    if (!select) return;

    const chapterSelect = getElement("filterChapter");
    const chapter = chapterSelect ? chapterSelect.value : "All";
    const previous = select.value || "All";

    const scopedTasks = tasks.filter(
        task => chapter === "All" || getTaskChapter(task) === chapter
    );

    const packageKeys = [...new Set(
        scopedTasks.map(getTaskPackageKey)
    )].sort((a, b) => {

        if (a === GENERAL_CHAPTER_PACKAGE_KEY) return 1;
        if (b === GENERAL_CHAPTER_PACKAGE_KEY) return -1;

        return a.localeCompare(b);

    });

    select.innerHTML = `<option value="All">All Equipment / Work Packages</option>`;

    packageKeys.forEach(key => {

        const option = document.createElement("option");

        option.value = key;

        option.textContent =
            key === GENERAL_CHAPTER_PACKAGE_KEY
                ? GENERAL_CHAPTER_PACKAGE_LABEL
                : key;

        select.appendChild(option);

    });

    select.value = packageKeys.includes(previous) ? previous : "All";

}


function handleChapterFilterChange() {

    updateEquipmentFilterOptions();
    renderTasks();

}


function openChapterTasks(chapter, workPackage = "") {

    showSection("tasks");

    const chapterFilter = getElement("filterChapter");

    if (chapterFilter) chapterFilter.value = chapter;

    updateEquipmentFilterOptions();

    const equipmentFilter = getElement("filterEquipment");

    if (equipmentFilter && workPackage) {
        equipmentFilter.value = workPackage;
    }

    renderTasks();

}


function renderChapterProgress() {

    const container = getElement("chapterProgressList");

    if (!container) return;

    const chapterGroups = CHAPTERS
        .map(chapter => ({
            chapter,
            tasks: tasks.filter(task => getTaskChapter(task) === chapter)
        }))
        .filter(group => group.tasks.length > 0);

    if (!chapterGroups.length) {

        container.innerHTML = `
            <div class="chapter-progress-empty">
                No chapter-linked tasks yet. Open any task and assign Chapter 1–10 to start this view.
            </div>
        `;

        return;

    }

    container.innerHTML = chapterGroups.map(group => {

        const avg = getAverageTaskProgress(group.tasks);
        const done = group.tasks.filter(task => task.status === "Done").length;

        const packageKeys = [...new Set(
            group.tasks.map(getTaskPackageKey)
        )].sort((a, b) => {

            if (a === GENERAL_CHAPTER_PACKAGE_KEY) return 1;
            if (b === GENERAL_CHAPTER_PACKAGE_KEY) return -1;

            return a.localeCompare(b);

        });

        const packageInfo = packageKeys.map(packageKey => {

            const packageTasks = group.tasks.filter(
                task => getTaskPackageKey(task) === packageKey
            );

            const isGeneral = packageKey === GENERAL_CHAPTER_PACKAGE_KEY;

            return {
                key: packageKey,
                name: isGeneral
                    ? GENERAL_CHAPTER_PACKAGE_LABEL
                    : packageKey,
                isGeneral: isGeneral,
                tasks: packageTasks,
                avg: getAverageTaskProgress(packageTasks),
                done: packageTasks.filter(task => task.status === "Done").length,
                owner: getEquipmentOwner(packageTasks),
                status: getEquipmentStatus(packageTasks)
            };

        });

        const readyCount = packageInfo.filter(item => item.status.cls === "ready").length;
        const inProgressCount = packageInfo.filter(item => item.status.cls === "in-progress").length;
        const notStartedCount = packageInfo.filter(item => item.status.cls === "not-started").length;
        const namedPackageCount = packageInfo.filter(item => !item.isGeneral).length;
        const generalPackage = packageInfo.find(item => item.isGeneral);

        const packageSummary = [
            namedPackageCount
                ? `${namedPackageCount} Work Package${namedPackageCount === 1 ? "" : "s"}`
                : "",
            generalPackage
                ? `${generalPackage.tasks.length} General Chapter Task${generalPackage.tasks.length === 1 ? "" : "s"}`
                : "",
            readyCount ? `${readyCount} Ready` : "",
            inProgressCount ? `${inProgressCount} In Progress` : "",
            notStartedCount ? `${notStartedCount} Not Started` : ""
        ].filter(Boolean).join(" · ");

        const packageRows = packageInfo.map(item => {

            const ownerInitial = item.owner && item.owner !== "-"
                ? item.owner.charAt(0).toUpperCase()
                : "?";

            const packageIcon = item.isGeneral ? "📄" : "⚙";

            return `
                <div class="chapter-equipment-row ${item.status.cls}">
                    <div class="chapter-equipment-main">
                        <div class="chapter-equipment-icon">${packageIcon}</div>
                        <div class="chapter-equipment-name">
                            <strong>${item.name}</strong>
                            <small>${item.done}/${item.tasks.length} task${item.tasks.length === 1 ? "" : "s"} completed</small>
                        </div>
                    </div>

                    <div class="chapter-equipment-pic">
                        <span class="chapter-equipment-avatar">${ownerInitial}</span>
                        <span>PIC <strong>${item.owner}</strong></span>
                    </div>

                    <span class="equipment-status-pill ${item.status.cls}">${item.status.label}</span>

                    <div class="equipment-progress-mini">
                        <strong>${item.avg}%</strong>
                        <div><span style="width:${item.avg}%"></span></div>
                    </div>

                    <button
                        type="button"
                        class="chapter-view-btn"
                        onclick="openChapterTasks('${group.chapter}', '${item.key.replace(/'/g, "\\'")}')"
                    >
                        View Tasks
                    </button>
                </div>
            `;

        }).join("");

        const currentSvStatus = getChapterSvStatus(group.chapter);

        return `
            <div class="chapter-progress-card">
                <div class="chapter-progress-card-head">
                    <div class="chapter-progress-head-copy">
                        <div class="chapter-progress-kicker">CHAPTER PROGRESS</div>
                        <div class="chapter-progress-title">
                            <strong>${group.chapter}</strong>
                            <span class="task-classification-tag">${done}/${group.tasks.length} tasks done</span>
                        </div>
                        <div class="chapter-progress-meta">${packageSummary}</div>
                    </div>

                    <div class="chapter-progress-score" title="Average progress of linked tasks">
                        <strong>${avg}%</strong>
                        <span>Overall</span>
                    </div>
                </div>

                <div class="chapter-progress-bar">
                    <span style="width:${avg}%"></span>
                </div>

                <div class="chapter-progress-actions">
                    <button
                        type="button"
                        class="chapter-view-btn"
                        onclick="openChapterTasks('${group.chapter}')"
                    >
                        View Chapter Tasks
                    </button>
                </div>

                <div class="sv-review-block">
                    <div class="sv-review-head">
                        <div>
                            <span>SV REVIEW CYCLE</span>
                            <small>Supervisor review milestone for ${group.chapter}</small>
                        </div>

                        <select
                            class="sv-status-select status-${currentSvStatus}"
                            onchange="setChapterSvStatus('${group.chapter}', this.value)"
                            ${isLecturer() ? "disabled" : ""}
                        >
                            ${SV_REVIEW_FLOW.map(item => `
                                <option value="${item.key}" ${currentSvStatus === item.key ? "selected" : ""}>
                                    ${item.label}
                                </option>
                            `).join("")}
                        </select>
                    </div>

                    <div class="sv-review-steps">
                        ${renderSvReviewSteps(currentSvStatus)}
                    </div>

                    ${renderLinkedMeetingSummary(group.chapter)}
                </div>

                ${packageRows ? `<div class="chapter-equipment-list">${packageRows}</div>` : ""}
            </div>
        `;

    }).join("");

}



let resources = [];

let openChapters = [];


// ============================================================
// MEMBER PHOTOS (uploaded via Firebase Storage, synced live)
// ============================================================
//
// Each member can upload their own photo from the Team page.
// URLs are stored in Firestore (trackerData/memberPhotos) and
// merged into the `members` array at render time, so all
// devices see the same photo without editing app.js.
// ============================================================

let memberPhotos = {};


function listenToMemberPhotos() {

    if (!db) return;

    db.collection("trackerData")
        .doc("memberPhotos")
        .onSnapshot(
            doc => {

                memberPhotos = doc.exists
                    ? (doc.data().map || {})
                    : {};

                renderTeam();

                renderMyDay();

                renderLoginScreen();

                renderCurrentUserBadge();

                renderTasks();

            },
            error => {

                console.error(
                    "Member photos sync error:",
                    error
                );

            }
        );

}


function saveMemberPhotosData() {

    if (!db) return;

    db.collection("trackerData")
        .doc("memberPhotos")
        .set({
            map: memberPhotos
        })
        .catch(error => {

            console.error(
                "Save member photos failed:",
                error
            );

        });

}


function uploadMemberPhoto(file, memberName) {

    return new Promise(
        (resolve, reject) => {

            if (!storage) {

                reject(
                    new Error(
                        "Firebase Storage not configured."
                    )
                );

                return;

            }

            const safeName =
                "avatars/" +
                memberName.replace(/[^a-zA-Z0-9._-]/g, "_") +
                "_" +
                Date.now();

            const storageRef =
                storage.ref().child(safeName);

            storageRef.put(file)
                .then(snapshot =>
                    snapshot.ref.getDownloadURL()
                )
                .then(resolve)
                .catch(reject);

        }
    );

}


async function changeMyPhoto(event) {

    const input = event.target;

    if (!input.files || !input.files.length) {
        return;
    }

    const currentUser = getCurrentUser();

    if (!currentUser) {

        showToast("Please log in first.");

        return;

    }

    const file = input.files[0];

    if (!file.type.startsWith("image/")) {

        showToast("Please choose an image file.");

        return;

    }

    if (file.size > 5 * 1024 * 1024) {

        showToast("Please choose an image under 5MB.");

        return;

    }

    try {

        const url =
            await uploadMemberPhoto(file, currentUser);

        memberPhotos[currentUser] = url;

        saveMemberPhotosData();

        logActivity("updated their profile photo");

    }

    catch (error) {

        console.error("Photo upload failed:", error);

        showToast(
            "❌ Photo upload failed: " +
            error.message
        );

    }

    input.value = "";

}


function getMemberPhotoUrl(name) {

    return memberPhotos[name] || "";

}


// ============================================================
// DELETE REQUESTS (non-leader members must ask the leader)
// ============================================================
//
// Anggota biasa masih boleh cuba "Delete", tapi ia hanya hantar
// permintaan kepada Group Leader melalui notification. Leader
// tap notification tu untuk Approve (padam betul-betul) atau
// Reject (tak jadi apa-apa).
// ============================================================

let deleteRequests = [];


function listenToDeleteRequests() {

    if (!db) return;

    db.collection("trackerData")
        .doc("deleteRequests")
        .onSnapshot(
            doc => {

                deleteRequests = doc.exists
                    ? (sanitizeStoredData(doc.data().list) || [])
                    : [];

            },
            error => {

                console.error(
                    "Delete requests sync error:",
                    error
                );

            }
        );

}


function saveDeleteRequestsData() {

    if (!db) return;

    db.collection("trackerData")
        .doc("deleteRequests")
        .set({
            list: deleteRequests
        })
        .catch(error => {

            console.error(
                "Save delete requests failed:",
                error
            );

        });

}


function requestDelete(type, itemId, itemName) {

    const currentUser = getCurrentUser() || "Unknown";

    const request = {

        id: Date.now() + Math.random(),

        type: type,

        itemId: itemId,

        itemName: itemName,

        requestedBy: currentUser,

        time: new Date().toISOString()

    };

    deleteRequests.push(request);

    saveDeleteRequestsData();

    addNotification({

        text: `<strong>${currentUser}</strong> requested to delete ${type} "${itemName}" — tap to approve/reject`,

        forUsers: [LEADER_NAME],

        relatedType: "deleteRequest",

        relatedId: request.id

    });

    showToast(`Delete request sent to ${LEADER_NAME} for approval.`);

}


let pendingDeleteRequestId = null;


function handleDeleteRequestNotification(requestId) {

    const request = deleteRequests.find(item => item.id === requestId);

    if (!request) {

        showToast("This request has already been handled.");

        return;

    }

    if (!isGroupLeader()) {

        showToast(`Only ${LEADER_NAME} can approve delete requests.`);

        return;

    }

    openDeleteRequestModal(request);

}


function openDeleteRequestModal(request) {

    pendingDeleteRequestId = request.id;

    const modal = getElement("deleteRequestModal");

    if (!modal) return;

    const typeLabel =
        request.type.charAt(0).toUpperCase() + request.type.slice(1);

    const titleEl = getElement("deleteRequestModalTitle");

    if (titleEl) {

        titleEl.textContent = `Delete ${typeLabel}?`;

    }

    const textEl = getElement("deleteRequestModalText");

    if (textEl) {

        textEl.innerHTML =
            `<strong>${request.requestedBy}</strong> wants to permanently delete this ${request.type}:`;

    }

    const nameEl = getElement("deleteRequestItemName");

    if (nameEl) {

        nameEl.textContent = request.itemName;

    }

    modal.classList.remove("hidden");

}


function closeDeleteRequestModal() {

    const modal = getElement("deleteRequestModal");

    if (modal) {

        modal.classList.add("hidden");

    }

    pendingDeleteRequestId = null;

}


function approveDeleteRequest() {

    const id = pendingDeleteRequestId;

    if (id === null) return;

    const request = deleteRequests.find(item => item.id === id);

    closeDeleteRequestModal();

    if (!request) return;

    deleteRequests = deleteRequests.filter(item => item.id !== id);

    saveDeleteRequestsData();

    if (request.type === "task") {

        performDeleteTaskById(request.itemId);

    }

    else if (request.type === "meeting") {

        performDeleteMeetingById(request.itemId);

    }

    else if (request.type === "resource") {

        performDeleteResourceById(request.itemId);

    }

    addNotification({
        text: `<strong>${LEADER_NAME}</strong> approved your delete request for "${request.itemName}"`,
        forUsers: [request.requestedBy],
        relatedType: "",
        relatedId: null
    });

}


function rejectDeleteRequest() {

    const id = pendingDeleteRequestId;

    if (id === null) return;

    const request = deleteRequests.find(item => item.id === id);

    closeDeleteRequestModal();

    if (!request) return;

    deleteRequests = deleteRequests.filter(item => item.id !== id);

    saveDeleteRequestsData();

    addNotification({
        text: `<strong>${LEADER_NAME}</strong> rejected your delete request for "${request.itemName}"`,
        forUsers: [request.requestedBy],
        relatedType: "",
        relatedId: null
    });

}


// ============================================================
// SYSTEM SETTINGS (Maintenance Mode + Announcement Banner)
// ============================================================
//
// Leader-only controls. Maintenance Mode blocks everyone except
// the leader from using the app (they see a maintenance screen
// instead). The Announcement Banner shows a pinned message to
// everyone, including the leader.
// ============================================================

let systemSettings = {

    maintenanceMode: false,

    maintenanceMessage: "",

    announcementActive: false,

    announcementText: "",

    submissionDeadline: "",

    submissionDeadlineLabel: "",

    currentFocusChapter: "",

    currentFocusText: "",

    currentFocusDate: ""

};


function listenToSystemSettings() {

    if (!db) return;

    db.collection("trackerData")
        .doc("systemSettings")
        .onSnapshot(
            doc => {

                if (doc.exists) {

                    const data = doc.data();

                    systemSettings = {

                        maintenanceMode: !!data.maintenanceMode,

                        maintenanceMessage: sanitizeText(data.maintenanceMessage || ""),

                        announcementActive: !!data.announcementActive,

                        announcementText: sanitizeText(data.announcementText || ""),

                        submissionDeadline: sanitizeText(data.submissionDeadline || ""),

                        submissionDeadlineLabel: sanitizeText(data.submissionDeadlineLabel || ""),

                        currentFocusChapter: sanitizeText(data.currentFocusChapter || ""),

                        currentFocusText: sanitizeText(data.currentFocusText || ""),

                        currentFocusDate: sanitizeText(data.currentFocusDate || "")

                    };

                }

                renderMaintenanceOverlay();

                renderAnnouncementBanner();

                renderSubmissionCountdown();

                renderCurrentFocus();

                renderCurrentFocusEditor();

            },
            error => {

                console.error(
                    "System settings sync error:",
                    error
                );

            }
        );

}


function saveSystemSettingsData() {

    if (!db) {

        showToast("Firebase not configured yet — settings won't be saved.");

        return;

    }

    db.collection("trackerData")
        .doc("systemSettings")
        .set(systemSettings)
        .catch(error => {

            console.error(
                "Save system settings failed:",
                error
            );

            showToast("❌ Save failed: " + error.message);

        });

}


function renderMaintenanceOverlay() {

    const overlay = getElement("maintenanceScreen");

    if (!overlay) return;

    const currentUser = getCurrentUser();

    const bypass = isGroupLeader();

    const shouldShow =
        systemSettings.maintenanceMode && currentUser && !bypass;

    overlay.classList.toggle("hidden", !shouldShow);

    const msgEl = getElement("maintenanceMessageText");

    if (msgEl) {

        msgEl.textContent =
            systemSettings.maintenanceMessage ||
            "The tracker is temporarily under maintenance. Please check back soon.";

    }

    const indicator = getElement("maintenanceLeaderIndicator");

    if (indicator) {

        indicator.classList.toggle(
            "hidden",
            !(systemSettings.maintenanceMode && bypass)
        );

    }

}


function renderAnnouncementBanner() {

    const banner = getElement("announcementBanner");

    if (!banner) return;

    const dismissedKey =
        "designProjectAnnouncementDismissed";

    const dismissedText =
        sessionStorage.getItem(dismissedKey);

    const shouldShow =
        systemSettings.announcementActive &&
        systemSettings.announcementText &&
        dismissedText !== systemSettings.announcementText;

    banner.classList.toggle("hidden", !shouldShow);

    const textEl = getElement("announcementBannerText");

    if (textEl) {

        textEl.textContent = systemSettings.announcementText;

    }

}


function dismissAnnouncementBanner() {

    sessionStorage.setItem(
        "designProjectAnnouncementDismissed",
        systemSettings.announcementText
    );

    renderAnnouncementBanner();

}


function populateAdminForm() {

    if (!isGroupLeader()) return;

    renderAdminAiInsightPanel();

    const maintenanceToggle = getElement("maintenanceModeToggle");

    if (maintenanceToggle) {

        maintenanceToggle.checked = !!systemSettings.maintenanceMode;

    }

    const maintenanceMsg = getElement("maintenanceMessageInput");

    if (maintenanceMsg) {

        maintenanceMsg.value = systemSettings.maintenanceMessage || "";

    }

    const announceToggle = getElement("announcementActiveToggle");

    if (announceToggle) {

        announceToggle.checked = !!systemSettings.announcementActive;

    }

    const announceText = getElement("announcementTextInput");

    if (announceText) {

        announceText.value = systemSettings.announcementText || "";

    }

}


function saveAdminSettings(event) {

    event.preventDefault();

    if (!isGroupLeader()) {

        showToast(`Only ${LEADER_NAME} can change system settings.`);

        return;

    }

    const maintenanceModeEl = getElement("maintenanceModeToggle");

    const maintenanceMessageEl = getElement("maintenanceMessageInput");

    const announcementActiveEl = getElement("announcementActiveToggle");

    const announcementTextEl = getElement("announcementTextInput");

    const wasMaintenanceOn = systemSettings.maintenanceMode;

    systemSettings = {

        maintenanceMode: maintenanceModeEl ? maintenanceModeEl.checked : false,

        maintenanceMessage: maintenanceMessageEl ? sanitizeText(maintenanceMessageEl.value) : "",

        announcementActive: announcementActiveEl ? announcementActiveEl.checked : false,

        announcementText: announcementTextEl ? sanitizeText(announcementTextEl.value) : "",

        submissionDeadline: systemSettings.submissionDeadline || "",

        submissionDeadlineLabel: systemSettings.submissionDeadlineLabel || "",

        currentFocusChapter: systemSettings.currentFocusChapter || "",

        currentFocusText: systemSettings.currentFocusText || "",

        currentFocusDate: systemSettings.currentFocusDate || ""

    };

    saveSystemSettingsData();

    logActivity(
        `updated system settings (maintenance: ${systemSettings.maintenanceMode ? "ON" : "OFF"}` +
        (systemSettings.maintenanceMode !== wasMaintenanceOn ? " — changed" : "") +
        `, announcement: ${systemSettings.announcementActive ? "ON" : "OFF"})`
    );

    renderMaintenanceOverlay();

    renderAnnouncementBanner();

    showToast("System settings saved.");

}


// ============================================================
// THIS WEEK'S FOCUS
// ============================================================
//
// Leader configures one compact weekly focus in Leader Hub.
// Everyone sees it in My Day. It deliberately does not appear
// on the main Dashboard to keep the overview uncluttered.
// ============================================================

function populateCurrentFocusChapterSelect() {

    const select = getElement("currentFocusChapter");

    if (!select) return;

    const previous = systemSettings.currentFocusChapter || "";

    select.innerHTML = `<option value="">No active chapter focus</option>`;

    CHAPTERS.forEach(chapter => {

        const option = document.createElement("option");

        option.value = chapter;
        option.textContent = chapter;

        select.appendChild(option);

    });

    select.value = CHAPTERS.includes(previous) ? previous : "";

}


function renderCurrentFocusEditor() {

    if (!isGroupLeader()) return;

    populateCurrentFocusChapterSelect();

    const textInput = getElement("currentFocusText");
    const dateInput = getElement("currentFocusDate");

    if (textInput && document.activeElement !== textInput) {
        textInput.value = systemSettings.currentFocusText || "";
    }

    if (dateInput && document.activeElement !== dateInput) {
        dateInput.value = systemSettings.currentFocusDate || "";
    }

}


function saveCurrentFocus() {

    if (!isGroupLeader()) {

        showToast(`Only ${LEADER_NAME} can set the weekly focus.`);

        return;

    }

    const chapterInput = getElement("currentFocusChapter");
    const textInput = getElement("currentFocusText");
    const dateInput = getElement("currentFocusDate");

    const chapter = chapterInput ? sanitizeText(chapterInput.value) : "";
    const text = textInput ? sanitizeText(textInput.value) : "";
    const date = dateInput ? sanitizeText(dateInput.value) : "";

    if (!chapter && !text) {

        systemSettings.currentFocusChapter = "";
        systemSettings.currentFocusText = "";
        systemSettings.currentFocusDate = "";

        saveSystemSettingsData();

        renderCurrentFocus();

        showToast("This week's focus cleared.");

        logActivity("cleared the weekly project focus");

        return;

    }

    systemSettings.currentFocusChapter = chapter;
    systemSettings.currentFocusText = text;
    systemSettings.currentFocusDate = date;

    saveSystemSettingsData();

    renderCurrentFocus();

    logActivity(
        `updated the weekly focus${chapter ? ` to ${chapter}` : ""}`
    );

    showToast("This week's focus saved.");

}


function formatFocusDate(dateString) {

    if (!dateString) return "";

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

}


function renderCurrentFocus() {

    const card = getElement("mydayFocusCard");

    if (!card) return;

    if (isLecturer()) {

        card.classList.add("hidden");
        card.innerHTML = "";

        return;

    }

    const chapter = systemSettings.currentFocusChapter || "";
    const text = systemSettings.currentFocusText || "";
    const date = systemSettings.currentFocusDate || "";

    if (!chapter && !text) {

        card.classList.add("hidden");
        card.innerHTML = "";

        return;

    }

    const title = chapter || "Team Focus";

    let dateChip = "";

    if (date) {

        const days = getDaysLeft(date);

        let timing = "";

        if (days < 0) timing = "Past target";
        else if (days === 0) timing = "Due today";
        else if (days === 1) timing = "1 day left";
        else timing = `${days} days left`;

        dateChip = `
            <span class="myday-focus-chip">
                📅 ${formatFocusDate(date)} · ${timing}
            </span>
        `;

    }

    const chapterButton = chapter
        ? `
            <button
                type="button"
                class="myday-focus-action"
                onclick="openChapterTasks('${chapter.replace(/'/g, "\\'")}')"
            >
                View Chapter Tasks →
            </button>
        `
        : "";

    card.innerHTML = `
        <div>
            <div class="myday-focus-kicker">🎯 This Week's Focus</div>
            <h4 class="myday-focus-title">${title}</h4>
            ${text ? `<div class="myday-focus-target">${text}</div>` : ""}
            <div class="myday-focus-meta">
                ${chapter ? `<span class="myday-focus-chip">📚 ${chapter}</span>` : ""}
                ${dateChip}
            </div>
        </div>

        ${chapterButton}
    `;

    card.classList.remove("hidden");

}


// ============================================================
// LEADER HUB (leader-only — countdown, nudges, private notes)
// ============================================================
//
// This whole section is only ever rendered for the group leader
// (see showSection's "leaderhub" guard and applyRoleRestrictions
// hiding the nav button). Note: this is a front-end restriction
// only — real privacy for the notes doc would need Firestore
// security rules keyed to the leader's UID.
// ============================================================

function saveSubmissionDeadline() {

    if (!isGroupLeader()) {

        showToast(`Only ${LEADER_NAME} can set the submission date.`);

        return;

    }

    const dateInput = getElement("submissionDeadlineInput");

    const labelInput = getElement("submissionDeadlineLabel");

    systemSettings.submissionDeadline = dateInput ? dateInput.value : "";

    systemSettings.submissionDeadlineLabel = labelInput ? sanitizeText(labelInput.value) : "";

    saveSystemSettingsData();

    logActivity(
        systemSettings.submissionDeadline
            ? `set the submission countdown to ${systemSettings.submissionDeadline}`
            : "cleared the submission countdown"
    );

    renderSubmissionCountdown();

    showToast("Submission date saved.");

}


function renderSubmissionCountdown() {

    const display = getElement("countdownDisplay");

    if (!display) return;

    const dateInput = getElement("submissionDeadlineInput");

    const labelInput = getElement("submissionDeadlineLabel");

    if (dateInput) dateInput.value = systemSettings.submissionDeadline || "";

    if (labelInput) labelInput.value = systemSettings.submissionDeadlineLabel || "";

    if (!systemSettings.submissionDeadline) {

        display.innerHTML = `<div class="countdown-empty">No submission date set yet.</div>`;

        return;

    }

    const days = getDaysLeft(systemSettings.submissionDeadline);

    const label = systemSettings.submissionDeadlineLabel || "Submission";

    if (days < 0) {

        display.innerHTML = `
            <div class="countdown-past">Deadline passed</div>
            <div class="countdown-label">${label}</div>
            <div class="countdown-date">${systemSettings.submissionDeadline}</div>
        `;

        return;

    }

    let numberClass = "";

    if (days <= 3) numberClass = "countdown-urgent";

    else if (days <= 7) numberClass = "countdown-warning";

    display.innerHTML = `
        <div class="countdown-number ${numberClass}">${days}</div>
        <div class="countdown-unit">DAY${days === 1 ? "" : "S"} LEFT</div>
        <div class="countdown-label">${label}</div>
        <div class="countdown-date">${systemSettings.submissionDeadline}</div>
    `;

}


function renderNeedsNudge() {

    const container = getElement("needsNudgeList");

    if (!container) return;

    const insights = members.map(member => {

        const memberTasks =
            tasks.filter(
                task =>
                    task.mainPIC === member.name ||
                    (task.assigned && task.assigned.includes(member.name))
            );

        const overdue =
            memberTasks.filter(
                task => task.status !== "Done" && getDaysLeft(task.deadline) < 0
            ).length;

        const avgProgress =
            memberTasks.length
                ? Math.round(
                    memberTasks.reduce((sum, task) => sum + Number(task.progress || 0), 0) /
                    memberTasks.length
                )
                : null;

        // Score: overdue tasks weigh heaviest, then low average progress.
        const score =
            overdue * 100 +
            (avgProgress === null ? 0 : Math.max(0, 60 - avgProgress));

        return { name: member.name, overdue, avgProgress, taskCount: memberTasks.length, score };

    })
        .filter(item => item.score > 0 || item.overdue > 0)
        .sort((a, b) => b.score - a.score);

    if (insights.length === 0) {

        container.innerHTML = `
            <div class="nudge-all-good">
                🎉 Everyone's on track — no nudges needed right now.
            </div>
        `;

        return;

    }

    container.innerHTML = "";

    insights.forEach(item => {

        const row = document.createElement("div");

        row.className = "nudge-item";

        const statsParts = [];

        if (item.overdue > 0) {

            statsParts.push(`<span class="nudge-overdue">${item.overdue} overdue</span>`);

        }

        if (item.avgProgress !== null) {

            statsParts.push(`${item.avgProgress}% avg progress`);

        }

        statsParts.push(`${item.taskCount} task${item.taskCount === 1 ? "" : "s"}`);

        row.innerHTML = `

            <div class="nudge-info">
                <div class="nudge-name">👤 ${item.name}</div>
                <div class="nudge-stats">${statsParts.join(" · ")}</div>
            </div>

            <button
                type="button"
                class="nudge-remind-btn"
                data-name="${item.name}"
            >
                🔔 Remind
            </button>

        `;

        container.appendChild(row);

    });

    container.querySelectorAll(".nudge-remind-btn").forEach(button => {

        button.addEventListener("click", event => {

            remindMember(event.currentTarget.dataset.name);

            event.currentTarget.disabled = true;

            event.currentTarget.textContent = "✓ Sent";

        });

    });

}


function remindMember(memberName) {

    const currentUser = getCurrentUser() || LEADER_NAME;

    addNotification({

        text: `<strong>${currentUser}</strong> sent you a friendly reminder to check your tasks 🔔`,

        forUsers: [memberName],

        relatedType: "",

        relatedId: null

    });

    logActivity(`sent a reminder nudge to ${memberName}`);

    showToast(`Reminder sent to ${memberName}.`);

}


let leaderNotesSaveTimer = null;

let leaderNotesLoaded = false;


function listenToLeaderNotes() {

    if (!db) return;

    db.collection("trackerData")
        .doc("leaderNotes")
        .onSnapshot(
            doc => {

                const notesField = getElement("leaderPrivateNotes");

                // Don't stomp on text the leader is actively typing —
                // only populate the field the first time data arrives,
                // or when the field isn't currently focused.
                if (notesField && (!leaderNotesLoaded || document.activeElement !== notesField)) {

                    notesField.value = doc.exists ? (doc.data().text || "") : "";

                }

                leaderNotesLoaded = true;

            },
            error => {

                console.error("Leader notes sync error:", error);

            }
        );

}


function scheduleLeaderNotesSave() {

    const statusEl = getElement("leaderNotesSavedIndicator");

    if (statusEl) statusEl.textContent = "Saving...";

    if (leaderNotesSaveTimer) clearTimeout(leaderNotesSaveTimer);

    leaderNotesSaveTimer = setTimeout(saveLeaderNotesNow, 800);

}


function saveLeaderNotesNow() {

    if (!db || !isGroupLeader()) return;

    const notesField = getElement("leaderPrivateNotes");

    const statusEl = getElement("leaderNotesSavedIndicator");

    db.collection("trackerData")
        .doc("leaderNotes")
        .set({

            text: notesField ? notesField.value : "",

            updatedBy: getCurrentUser() || LEADER_NAME,

            updatedAt: new Date().toISOString()

        })
        .then(() => {

            if (statusEl) {

                statusEl.textContent =
                    "Saved · " + new Date().toLocaleTimeString();

            }

        })
        .catch(error => {

            console.error("Save leader notes failed:", error);

            if (statusEl) statusEl.textContent = "❌ Failed to save.";

        });

}


function renderLeaderHub() {

    renderCurrentFocusEditor();

    renderSubmissionCountdown();

    renderNeedsNudge();

}


// ============================================================
// AI INSIGHT (leader-only generate, everyone can view)
// ============================================================
//
// Cloud Function `generateAiInsight` does the actual work (calls
// Claude, enforces leader-only + once-a-week rate limit
// server-side). This client code just gathers a compact snapshot,
// calls the function, and renders whatever is in Firestore.
// ============================================================

let aiInsight = null;


function listenToAiInsight() {

    if (!db) return;

    db.collection("trackerData")
        .doc("aiInsight")
        .onSnapshot(
            doc => {

                aiInsight = doc.exists ? doc.data() : null;

                renderAiInsightCard();

                renderAdminAiInsightPanel();

            },
            error => {

                console.error("AI Insight sync error:", error);

            }
        );

}


function buildAiInsightSnapshot() {

    const activeTasks = tasks.filter(task => task.status !== "Done");

    const overdueCount = tasks.filter(
        task => task.status !== "Done" && getDaysLeft(task.deadline) < 0
    ).length;

    const taskSummaries = activeTasks
        .slice(0, 40) // keep the payload compact
        .map(task => ({
            name: task.name,
            mainPIC: task.mainPIC || "",
            status: task.status,
            progress: Number(task.progress || 0),
            deadline: task.deadline || ""
        }));

    const memberWorkload = members.map(member => {

        const memberTasks = tasks.filter(
            task =>
                task.mainPIC === member.name ||
                (task.assigned && task.assigned.includes(member.name))
        );

        const avgProgress =
            memberTasks.length
                ? Math.round(
                    memberTasks.reduce((sum, task) => sum + Number(task.progress || 0), 0) /
                    memberTasks.length
                )
                : 0;

        return {
            name: member.name,
            taskCount: memberTasks.length,
            avgProgress: avgProgress
        };

    });

    const currentOverall =
        tasks.length === 0
            ? 0
            : Math.round(
                tasks.reduce((sum, task) => sum + Number(task.progress || 0), 0) / tasks.length
            );

    // Historical progress chart tracking was removed from the dashboard.
    // Keep this field for Cloud Function payload compatibility.
    const previousOverall = null;

    return {
        tasks: taskSummaries,
        memberWorkload: memberWorkload,
        currentOverall: currentOverall,
        previousOverall: previousOverall,
        overdueCount: overdueCount
    };

}


let aiInsightLoading = false;


async function generateAiInsight() {

    if (!isGroupLeader()) {

        showToast(`Only ${LEADER_NAME} can generate the AI Insight.`);

        return;

    }

    if (!functionsInstance) {

        showToast("AI Insight isn't set up yet (Firebase Functions not configured).");

        return;

    }

    if (aiInsightLoading) return;

    aiInsightLoading = true;

    renderAdminAiInsightPanel();

    try {

        const callable = functionsInstance.httpsCallable("generateAiInsight");

        const snapshot = buildAiInsightSnapshot();

        await callable({
            snapshot: snapshot,
            generatedByName: getCurrentUser() || LEADER_NAME
        });

        logActivity("generated a new AI Insight report");

        showToast("AI Insight generated!");

    }

    catch (error) {

        console.error("AI Insight generation failed:", error);

        const message =
            (error && error.message) ? error.message : "Failed to generate AI Insight.";

        showToast("❌ " + message);

    }

    aiInsightLoading = false;

    renderAdminAiInsightPanel();

}


function formatAiInsightTimestamp(value) {

    if (!value) return "";

    const date = value.toDate ? value.toDate() : new Date(value);

    return date.toLocaleString();

}


function renderAiInsightCard() {

    const container = getElement("aiInsightCard");

    if (!container) return;

    if (!aiInsight || !aiInsight.summary) {

        container.classList.add("hidden");

        container.innerHTML = "";

        return;

    }

    container.classList.remove("hidden");

    container.innerHTML = `

        <div class="ai-insight-header">
            <span class="ai-insight-icon">🪄</span>
            <div>
                <div class="ai-insight-title">${aiInsight.title || "AI Insight"}</div>
                <div class="ai-insight-meta">
                    <span class="ai-insight-badge">🤖 AI-Generated</span>
                    · Requested by ${aiInsight.generatedBy || "Group Leader"} · ${formatAiInsightTimestamp(aiInsight.generatedAt)}
                </div>
            </div>
        </div>

        ${aiInsight.summary ? `<p class="ai-insight-summary">${aiInsight.summary}</p>` : ""}

        <div class="ai-insight-rows">

            ${aiInsight.risk ? `<div class="ai-insight-row ai-insight-risk">${aiInsight.risk}</div>` : ""}

            ${aiInsight.workload ? `<div class="ai-insight-row">${aiInsight.workload}</div>` : ""}

            ${aiInsight.praise ? `<div class="ai-insight-row ai-insight-praise">${aiInsight.praise}</div>` : ""}

        </div>

        ${aiInsight.action ? `<div class="ai-insight-action"><strong>👉 Cadangan:</strong> ${aiInsight.action}</div>` : ""}

    `;

}


function renderAdminAiInsightPanel() {

    const container = getElement("aiInsightAdminPanel");

    if (!container || !isGroupLeader()) return;

    const generateBtn = getElement("aiInsightGenerateBtn");

    const statusEl = getElement("aiInsightAdminStatus");

    if (generateBtn) {

        generateBtn.disabled = aiInsightLoading;

        generateBtn.textContent = aiInsightLoading ? "🪄 Analyzing..." : "🪄 Generate AI Insight";

    }

    if (statusEl) {

        if (aiInsightLoading) {

            statusEl.textContent = "Analyzing tasks, comparing trends, detecting risks...";

        }

        else if (aiInsight && aiInsight.generatedAt) {

            statusEl.textContent =
                `AI-generated report last requested by ${aiInsight.generatedBy || "Group Leader"} on ${formatAiInsightTimestamp(aiInsight.generatedAt)}. Can be regenerated once a week.`;

        }

        else {

            statusEl.textContent = "No AI Insight generated yet. Click the button above to generate the first one.";

        }

    }

}


// ============================================================
// ACTIVITY LOG
// ============================================================

let activityLog = [];


function listenToActivityLog() {

    if (!db) return;

    db.collection("trackerData")
        .doc("activityLog")
        .onSnapshot(
            doc => {

                activityLog = doc.exists
                    ? (sanitizeStoredData(doc.data().list) || [])
                    : [];

                renderActivityLog();
                renderTeamPresence();

            },
            error => {

                console.error(
                    "Activity log sync error:",
                    error
                );

            }
        );

}


function saveActivityLogData() {

    if (!db) return;

    db.collection("trackerData")
        .doc("activityLog")
        .set({
            list: activityLog
        })
        .catch(error => {

            console.error(
                "Save activity log failed:",
                error
            );

        });

}


function logActivity(text) {

    const entry = {

        text: text,

        user: getCurrentUser() || "Unknown",

        time: new Date().toISOString()

    };

    activityLog.unshift(entry);

    if (activityLog.length > 100) {

        activityLog = activityLog.slice(0, 100);

    }

    saveActivityLogData();

}


function formatActivityTime(isoString) {

    const date = new Date(isoString);

    return date.toLocaleString();

}


function renderActivityLog() {

    const container = getElement("activityLogList");

    if (!container) return;

    container.innerHTML = "";

    if (activityLog.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🕘</div>
                <div class="empty-state-title">No activity yet</div>
                <div class="empty-state-text">Every task, meeting, and comment update will show up here.</div>
            </div>
        `;

        return;

    }

    activityLog.forEach(entry => {

        container.innerHTML += `

            <div class="activity-item">

                <div class="activity-text">
                    <strong>${entry.user}</strong> ${entry.text}
                </div>

                <div class="activity-time">
                    ${formatActivityTime(entry.time)}
                </div>

            </div>

        `;

    });

}


// ============================================================
// NOTIFICATIONS
// ============================================================

let notifications = [];


function listenToNotifications() {

    if (!db) return;

    db.collection("trackerData")
        .doc("notifications")
        .onSnapshot(
            doc => {

                notifications = doc.exists
                    ? (doc.data().list || [])
                    : [];

                renderNotifDropdown();

            },
            error => {

                console.error(
                    "Notifications sync error:",
                    error
                );

            }
        );

}


function saveNotificationsData() {

    if (!db) return;

    db.collection("trackerData")
        .doc("notifications")
        .set({
            list: notifications
        })
        .catch(error => {

            console.error(
                "Save notifications failed:",
                error
            );

        });

}


function addNotification({ text, forUsers, relatedType, relatedId }) {

    const entry = {

        id: Date.now() + Math.random(),

        text: text,

        forUsers: forUsers || [],

        relatedType: relatedType || "",

        relatedId: relatedId || null,

        readBy: [],

        time: new Date().toISOString()

    };

    notifications.unshift(entry);

    if (notifications.length > 150) {

        notifications = notifications.slice(0, 150);

    }

    saveNotificationsData();

}


function getMyNotifications() {

    const currentUser = getCurrentUser();

    if (!currentUser) return [];

    return notifications.filter(
        entry => entry.forUsers.includes(currentUser)
    );

}


function toggleNotifDropdown() {

    const dropdown = getElement("notifDropdown");

    if (!dropdown) return;

    dropdown.classList.toggle("hidden");

}


function updateNotifBadge() {

    const badge = getElement("notifBadge");

    if (!badge) return;

    const currentUser = getCurrentUser();

    const unread =
        getMyNotifications().filter(
            entry => !entry.readBy.includes(currentUser)
        ).length;

    if (unread > 0) {

        badge.textContent = unread > 99 ? "99+" : String(unread);

        badge.classList.remove("hidden");

    }

    else {

        badge.classList.add("hidden");

    }

}


function renderNotifDropdown() {

    const list = getElement("notifList");

    if (!list) return;

    const mine = getMyNotifications();

    list.innerHTML = "";

    if (mine.length === 0) {

        list.innerHTML = `
            <div class="empty-state" style="padding:34px 16px;">
                <div class="empty-state-icon" style="font-size:30px;">🔔</div>
                <div class="empty-state-title" style="font-size:13px;">You're all caught up</div>
                <div class="empty-state-text" style="font-size:11.5px;">No notifications right now.</div>
            </div>
        `;

        updateNotifBadge();

        return;

    }

    const currentUser = getCurrentUser();

    mine.slice(0, 40).forEach(entry => {

        const isUnread = !entry.readBy.includes(currentUser);

        const item = document.createElement("div");

        item.className = "notif-item" + (isUnread ? " unread" : "");

        item.innerHTML = `
            <div class="notif-item-text">${entry.text}</div>
            <div class="notif-item-time">${formatActivityTime(entry.time)}</div>
        `;

        item.addEventListener("click", () => openNotification(entry.id));

        list.appendChild(item);

    });

    updateNotifBadge();

}


function openNotification(id) {

    const currentUser = getCurrentUser();

    const notif = notifications.find(entry => entry.id === id);

    if (!notif) return;

    if (!notif.readBy.includes(currentUser)) {

        notif.readBy.push(currentUser);

        saveNotificationsData();

    }

    const dropdown = getElement("notifDropdown");

    if (dropdown) dropdown.classList.add("hidden");

    if (notif.relatedType === "deleteRequest") {

        handleDeleteRequestNotification(notif.relatedId);

        return;

    }

    if (notif.relatedType === "task" && notif.relatedId) {

        showSection("tasks");

        editTask(notif.relatedId);

    }

    else if (notif.relatedType === "resource" && notif.relatedId) {

        showSection("resources");

        const resource = resources.find(item => item.id === notif.relatedId);

        if (resource && !openChapters.includes(resource.chapter)) {

            openChapters.push(resource.chapter);

            renderChapters();

        }

    }

}


function markAllNotificationsRead() {

    const currentUser = getCurrentUser();

    if (!currentUser) return;

    let changed = false;

    getMyNotifications().forEach(entry => {

        if (!entry.readBy.includes(currentUser)) {

            entry.readBy.push(currentUser);

            changed = true;

        }

    });

    if (changed) saveNotificationsData();

}


// Close the notification dropdown when clicking outside of it.
document.addEventListener("click", event => {

    const wrap = document.querySelector(".notif-bell-wrap");

    if (wrap && !wrap.contains(event.target)) {

        const dropdown = getElement("notifDropdown");

        if (dropdown) dropdown.classList.add("hidden");

    }

});


// ============================================================
// DAILY QUOTE (rotates by date, same quote for everyone each day)
// ============================================================

// Rotation restarts at quote #1 from this date onward. Set to
// "tomorrow" relative to when this was last configured — update
// this date any time you want the rotation to restart from #1.
const QUOTE_START_DATE = "2026-08-24";

const DAILY_QUOTES = [

    { text: "Progress, not perfection — every task you finish today is one step closer to submission." },
    { text: "You don't have to see the whole staircase, just take the first step." },
    { text: "Small daily progress leads to big results." },
    { text: "Done is better than perfect. Ship it, then polish it." },
    { text: "The secret of getting ahead is getting started." },
    { text: "Discipline beats motivation when motivation runs out." },
    { text: "A little progress each day adds up to big results." },
    { text: "Your future self will thank you for the work you put in today." },
    { text: "Consistency is what transforms average into excellence." },
    { text: "It always seems impossible until it's done." },

    { text: "Alone we can do so little; together we can do so much." },
    { text: "A team that communicates well, finishes well." },
    { text: "Great things in this project won't be done by one person — they'll be done by all five of you." },
    { text: "Check in with your teammates today — a quick update saves a big headache later." },
    { text: "Teamwork makes the deadline work." },
    { text: "If you're stuck, ask your team. That's what they're here for." },
    { text: "Support each other today — someone might be having a harder day than you." },
    { text: "Good teams don't avoid conflict, they communicate through it." },

    { text: "The deadline is closer than it looks. But so is finishing this task. 👀" },
    { text: "Future you is currently begging present you to start early." },
    { text: "Submission day will come whether you're ready or not — so let's get ready. 🚀" },
    { text: "One chapter at a time. You've got this." },
    { text: "Overdue tasks don't disappear — they just get louder. Handle them today." },
    { text: "Coffee first, then conquer that checklist. ☕" },
    { text: "Every checklist item you tick off is a mini victory. Celebrate it." },
    { text: "The Gantt chart doesn't lie, but it also doesn't judge — get back on track today." },

    { text: "Every draft is progress, even the messy ones." },
    { text: "Good design takes iteration — don't fear the first ugly version." },
    { text: "Feedback isn't criticism, it's a shortcut to a better project." },
    { text: "The best designers weren't born great — they revised a lot." },
    { text: "Mistakes today are lessons for tomorrow's presentation." },

    { text: "You've made it this far — don't stop now." },
    { text: "This project is temporary, but what you learn from it isn't." },
    { text: "Tired is normal. Quitting isn't an option. Keep going." },
    { text: "One day, you'll look back at this project and be proud you didn't give up." },

    { text: "Satu je target — buat project ni sampai menang award. Jom push sama-sama! 🏆" },
    { text: "This could be the project that gets your name on stage. Make it count." },
    { text: "Last big project before you graduate — why not make it your best one?" },
    { text: "Awards don't go to the team that did okay. They go to the team that cared enough to go the extra mile." },
    { text: "One more push. One more late night. One more award-worthy project." },
    { text: "Degree almost done — legacy project loading. Let's make it unforgettable." },
    { text: "You've survived every semester so far. This is just the final boss level." },
    { text: "Kalau nak menang, kena buat lebih daripada 'cukup makan'. Let's aim higher." },
    { text: "This is your shot to end your degree with something you're proud to show off." },
    { text: "Best Project Award tak jatuh dari langit — ia dibina dari setiap task yang korang siapkan hari ni." },
    { text: "Imagine walking on that award stage because of THIS project. Worth the grind." },
    { text: "Last group project of your degree. Last chance to leave a mark. Make it legendary." },
    { text: "Champions aren't made in the final week — they're made in weeks like this one." },

    { text: "Kita bukan buat project ni sekadar nak lepas — kita target nak menang. Let's go! 🏆" },
    { text: "Bayangkan nama korang disebut time prize giving. That feeling? Worth every late night." },
    { text: "Last project sebelum grad — jangan main-main, buat sampai jadi 'Best Project' punya level." },
    { text: "Orang lain buat cukup pass. Kita buat sampai boleh menang. That's the difference." },
    { text: "Degree dah nak habis, tapi legacy kita baru nak mula. Let's make this project count." },
    { text: "Kalau nak trophy tu naik atas meja korang, kena mula dari hari ni — bukan last minute." },
    { text: "This is THE project. Yang orang ingat lama-lama. Let's build something award-winning." },
    { text: "Semangat sikit lagi — bayangkan stage, bayangkan trophy, then balik buat kerja. 😄" },
    { text: "Bukan sekadar submit untuk dapat marks — submit untuk buktikan korang punya kelas punya standard." },
    { text: "One shot. One team. One award. Let's earn it together." },
    { text: "Final year project ni bukan just assignment — ni statement korang sebelum grad. Make it loud." },
    { text: "Kalau nak menang award, effort kena beza dari orang lain. Let's be that team." },
    { text: "Every small task hari ni is one step closer to holding that trophy later. Keep pushing!" },
    { text: "This project could be the highlight of your whole degree. So why not aim for the top?" }

];


function getDayNumber(date) {

    // Counts days since a fixed reference date, so the rotation
    // always starts at quote #1 from QUOTE_START_DATE onward,
    // instead of being tied to day-of-year (which would land on a
    // random index depending on when the app was deployed).
    const start = new Date(QUOTE_START_DATE + "T00:00:00");

    const diff = date - start;

    return Math.floor(diff / (1000 * 60 * 60 * 24));

}


function getDailyQuote() {

    const dayNumber = getDayNumber(new Date());

    // Before the reference start date, just show quote #1 (safety
    // fallback — shouldn't normally happen once deployed).
    const safeDayNumber = dayNumber < 0 ? 0 : dayNumber;

    const index = safeDayNumber % DAILY_QUOTES.length;

    return DAILY_QUOTES[index];

}


function renderMydayQuote() {

    const container = getElement("mydayQuoteCard");

    if (!container) return;

    if (isLecturer()) {

        container.innerHTML = "";

        return;

    }

    const quote = getDailyQuote();

    container.innerHTML = `
        <div class="myday-quote-icon">💬</div>
        <div>
            <div class="myday-quote-text">${quote.text}</div>
            <div class="myday-quote-author">Quote of the Day</div>
        </div>
    `;

}


function maybeShowDailyQuotePopup() {

    if (isLecturer()) return;

    const currentUser = getCurrentUser();

    if (!currentUser) return;

    const today = formatDate(new Date());

    const storageKey = "designProjectQuoteSeen_" + currentUser;

    const lastSeen = localStorage.getItem(storageKey);

    if (lastSeen === today) return;

    const quote = getDailyQuote();

    const textEl = getElement("dailyQuoteModalText");

    const authorEl = getElement("dailyQuoteModalAuthor");

    if (textEl) textEl.textContent = quote.text;

    if (authorEl) authorEl.textContent = "— Quote of the Day";

    const modal = getElement("dailyQuoteModal");

    if (modal) modal.classList.remove("hidden");

    localStorage.setItem(storageKey, today);

}


function closeDailyQuoteModal() {

    const modal = getElement("dailyQuoteModal");

    if (modal) modal.classList.add("hidden");

    maybeShowCriticalAttentionPopup();

}


// ============================================================
// MY DAY (landing page after login)
// ============================================================

// Team mascot: visual companion driven by the shared task snapshot.
const teamMascot = { previous: null, timer: null, state: 'wave', message: '', started: false };

function renderTeamMascot() {
    const host = getElement('mydayContent');
    if (!host) return;
    let card = getElement('teamMascot');
    if (!card) {
        const style = document.createElement('style');
        style.textContent = `
        .dp-mascot{display:flex;align-items:center;gap:18px;padding:16px 20px;margin:0 0 22px;border:1px solid #dce9e9;border-radius:16px;background:#f4faf9;color:#193b48;position:relative}
        .dp-mascot svg{width:100px;height:108px;flex:none;overflow:visible}.dp-mascot-copy{flex:1;min-width:0}.dp-mascot-kicker{font-size:10px;letter-spacing:1.8px;font-weight:700;color:#4c787b}.dp-mascot h4{margin:5px 0;font-size:17px}.dp-mascot p{margin:0;font-size:13px;line-height:1.5;overflow-wrap:anywhere}.dp-mascot small{display:block;margin-top:7px;color:#5f747d;font-size:11px}
        .dp-mascot-toggle{align-self:flex-start;border:1px solid #cddedd;background:white;border-radius:8px;padding:6px 10px;color:#31585c;cursor:pointer;font:inherit;font-size:12px}.dp-mascot-toggle:focus-visible{outline:3px solid #228b91;outline-offset:3px}
        .dp-mascot .robot{animation:dp-breathe 3s ease-in-out infinite;transform-origin:50px 70px}.dp-mascot .arm{transform-box:fill-box;transform-origin:50% 15%}.dp-mascot[data-state=wave] .arm-right{animation:dp-wave .6s ease-in-out 6}.dp-mascot[data-state=working] .arm{animation:dp-type .5s ease-in-out infinite alternate}.dp-mascot[data-state=celebrate] .robot{animation:dp-hop .55s ease-in-out 6}.dp-mascot .spark{opacity:0}.dp-mascot[data-state=celebrate] .spark{opacity:1;animation:dp-twinkle .7s ease-in-out infinite alternate}.dp-mascot .laptop{display:none}.dp-mascot[data-state=working] .laptop{display:block}
        .dp-mascot.is-small{padding:10px 14px;gap:10px}.dp-mascot.is-small svg{width:35px;height:38px}.dp-mascot.is-small .dp-mascot-detail,.dp-mascot.is-small .dp-mascot-kicker{display:none}.dp-mascot.is-small h4{font-size:13px;margin:0}.dp-mascot.is-small .robot{animation:none}
        @keyframes dp-breathe{50%{transform:translateY(-3px)}}@keyframes dp-wave{50%{transform:rotate(-65deg)}}@keyframes dp-type{to{transform:rotate(15deg)}}@keyframes dp-hop{50%{transform:translateY(-9px) rotate(-4deg)}}@keyframes dp-twinkle{to{opacity:.25}}@media(prefers-reduced-motion:reduce){.dp-mascot *{animation:none!important}}@media(max-width:480px){.dp-mascot{gap:10px;padding:12px}.dp-mascot svg{width:66px;height:80px}.dp-mascot h4{font-size:15px}}
        `;
        document.head.appendChild(style);
        card = document.createElement('aside');
        card.id = 'teamMascot';
        card.className = 'dp-mascot';
        card.setAttribute('aria-label', 'Team mascot');
        card.innerHTML = `<svg viewBox="0 0 100 110" aria-hidden="true"><ellipse cx="50" cy="103" rx="30" ry="4" fill="#d8e9e5"/><g class="robot"><path d="M36 86v12m28-12v12" stroke="#325967" stroke-width="10" stroke-linecap="round"/><rect x="27" y="59" width="46" height="32" rx="12" fill="#258f95"/><path d="M37 62v25m26-25v25" stroke="#b9e3d8" stroke-width="4"/><rect x="40" y="72" width="20" height="11" rx="3" fill="#e9f6ef"/><g class="arm arm-left"><path d="M25 65l-8 17" stroke="#325967" stroke-width="9" stroke-linecap="round"/></g><g class="arm arm-right"><path d="M76 64l9-17" stroke="#325967" stroke-width="9" stroke-linecap="round"/><circle cx="86" cy="44" r="6" fill="#258f95"/></g><rect x="23" y="25" width="54" height="38" rx="14" fill="#325967"/><rect x="28" y="31" width="44" height="25" rx="10" fill="#e4f7ee"/><circle cx="39" cy="42" r="3.5" fill="#244954"/><circle cx="61" cy="42" r="3.5" fill="#244954"/><path d="M45 49q5 4 10 0" fill="none" stroke="#244954" stroke-width="2" stroke-linecap="round"/><path d="M24 28a26 22 0 0 1 52 0" fill="#f0bf51"/><rect x="46" y="6" width="8" height="20" rx="3" fill="#ffda7c"/><rect x="18" y="25" width="64" height="6" rx="3" fill="#d99c2d"/></g><g class="laptop"><rect x="25" y="79" width="50" height="24" rx="4" fill="#476c7d"/><circle cx="50" cy="90" r="3" fill="#b9e3d8"/><path d="M20 104h60" stroke="#325967" stroke-width="4" stroke-linecap="round"/></g><g class="spark" fill="#e6ac35"><path d="m10 15 2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="m88 7 2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><circle cx="91" cy="77" r="3"/></g></svg><div class="dp-mascot-copy"><div class="dp-mascot-kicker">YOUR TEAM COMPANION</div><h4>Meet Pip, your little engineer</h4><div class="dp-mascot-detail"><p class="dp-mascot-message" role="status" aria-live="polite"></p><small class="dp-mascot-count"></small></div></div><button type="button" class="dp-mascot-toggle" aria-expanded="true">Minimise</button>`;
        host.before(card);
        const toggle = card.querySelector('button');
        let collapsed = true;
        try { collapsed = localStorage.getItem('dpMascotMinimised') !== 'false'; } catch (_) {}
        function setCollapsed(value) {
            card.classList.toggle('is-small', value);
            toggle.textContent = value ? 'Expand' : 'Minimise';
            toggle.setAttribute('aria-expanded', String(!value));
        }
        setCollapsed(collapsed);
        toggle.onclick = () => {
            collapsed = !collapsed;
            setCollapsed(collapsed);
            try { localStorage.setItem('dpMascotMinimised', String(collapsed)); } catch (_) {}
        };
    }
    const snapshot = new Map(tasks.map(task => [String(task.id), task.status]));
    const completed = tasks.filter(task => task.status === 'Done').length;
    const working = tasks.filter(task => task.status === 'In Progress').length;
    const newlyDone = teamMascot.previous && tasks.find(task => task.status === 'Done' && teamMascot.previous.has(String(task.id)) && teamMascot.previous.get(String(task.id)) !== 'Done');
    teamMascot.previous = snapshot;
    const show = (state, message) => {
        teamMascot.state = state;
        teamMascot.message = message;
        card.dataset.state = state;
        card.querySelector('.dp-mascot-message').textContent = message;
    };
    const settle = () => {
        teamMascot.timer = null;
        const active = tasks.filter(task => task.status === 'In Progress').length;
        show(active ? 'working' : 'idle', active ? `${active} task${active === 1 ? ' is' : 's are'} in progress. One step closer, team!` : 'Taking a little breather. Ready when the team is.');
    };
    if (newlyDone) {
        clearTimeout(teamMascot.timer);
        show('celebrate', `Team win! “${newlyDone.name || 'A task'}” is now Done.`);
        teamMascot.timer = setTimeout(settle, 6000);
    } else if (!teamMascot.started) {
        teamMascot.started = true;
        show('wave', `Hi${getCurrentUser() ? ', ' + getCurrentUser() : ''}! Let’s build something together.`);
        teamMascot.timer = setTimeout(settle, 4000);
    } else if (!teamMascot.timer) {
        settle();
    }
    card.querySelector('.dp-mascot-count').textContent = tasks.length ? `${completed} / ${tasks.length} team tasks done · Based on shared task status` : 'Your team’s progress starts here';
}

function renderMyDay() {

    renderTeamMascot();

    renderMydayQuote();

    renderCurrentFocus();

    const greeting =
        getElement("mydayGreeting");

    const container =
        getElement("mydayContent");

    if (!container) return;

    const currentUser =
        getCurrentUser();

    if (greeting) {

        greeting.textContent =
            currentUser
                ? `👋 Hello, ${currentUser}`
                : "👋 Hello";

    }

    const myTasks =
        tasks.filter(
            task =>
                task.status !== "Done" &&
                (
                    task.mainPIC === currentUser ||
                    (task.assigned && task.assigned.includes(currentUser))
                )
        );

    const todayStr =
        formatDate(new Date());

    const dueTasks =
        myTasks
            .filter(
                task => getDaysLeft(task.deadline) <= 0
            )
            .sort(
                (a, b) => getDaysLeft(a.deadline) - getDaysLeft(b.deadline)
            );

    const upcomingTasks =
        myTasks
            .filter(
                task =>
                    getDaysLeft(task.deadline) > 0 &&
                    getDaysLeft(task.deadline) <= 3
            )
            .sort(
                (a, b) => getDaysLeft(a.deadline) - getDaysLeft(b.deadline)
            );

    const todaysMeetings =
        meetings.filter(
            meeting => meeting.date === todayStr
        );


    const overdueCount = dueTasks.filter(task => getDaysLeft(task.deadline) < 0).length;
    let html = `<div class="myday-brief" aria-label="Today's summary">
        <span><strong>${overdueCount}</strong> overdue</span>
        <span><strong>${dueTasks.length - overdueCount}</strong> due today</span>
        <span><strong>${upcomingTasks.length}</strong> due in 3 days</span>
        <span><strong>${todaysMeetings.length}</strong> meetings today</span>
    </div>`;
    if (!dueTasks.length && !upcomingTasks.length && !todaysMeetings.length) {
        html += '<p class="myday-calm">No deadlines in the next 3 days or meetings today.</p>';
    }
    if (dueTasks.length) html += '<div class="myday-section-title">DUE TODAY / OVERDUE</div>' + dueTasks.map(renderMydayTaskItem).join("");
    if (upcomingTasks.length) html += '<div class="myday-section-title">DUE SOON · NEXT 3 DAYS</div>' + upcomingTasks.map(renderMydayTaskItem).join("");
    if (!dueTasks.length && !upcomingTasks.length) {
        const continuing = selectMydayContinueTasks(myTasks);
        html += continuing.length
            ? '<div class="myday-section-title">CONTINUE WORKING</div>' + continuing.map(renderMydayContinueItem).join("")
            : '<p class="myday-calm">No unfinished tasks assigned to you.</p>';
    }
    if (todaysMeetings.length) {
        html += '<div class="myday-section-title">TODAY’S MEETINGS</div>' +
            todaysMeetings.map(meeting => `
                <div class="myday-item" onclick="editMeeting(${meeting.id})">
                    <div><div class="myday-item-title">📌 ${meeting.title}</div>
                    <div class="myday-item-sub">${meeting.time || "No time set"}${meeting.location ? " · " + meeting.location : ""}</div></div>
                </div>`).join("");
    }
    container.innerHTML = html;
    container.querySelectorAll("[data-myday-view]").forEach(button => {
        button.addEventListener("click", () => window.openTaskDetails(button.dataset.mydayView));
    });
    const quote = getElement("mydayQuoteCard");
    if (quote && container.parentElement === quote.parentElement) quote.before(container);
    if (!getElement("mydayBriefStyles")) {
        const style = document.createElement("style");
        style.id = "mydayBriefStyles";
        style.textContent = `
            #mydayContent { margin-bottom:22px; }
            #mydayContent .myday-brief { display:flex; flex-wrap:wrap; gap:8px 20px; padding:13px 16px; background:#f5f8fc; border:1px solid #e5ebf3; border-radius:12px; color:#64748b; font-size:12px; }
            #mydayContent .myday-brief strong { color:#1e293b; margin-right:3px; }
            #mydayContent .myday-calm { margin:12px 0; color:#64748b; font-size:12px; line-height:1.6; }
            #mydayContent .myday-continue-copy { flex:1; min-width:0; }
            #mydayContent .myday-item-title { overflow-wrap:anywhere; }
            #mydayContent .myday-continue { cursor:default; gap:14px; }
            #mydayContent .myday-continue button { flex-shrink:0; padding:9px 12px; border:1px solid #dae5fc; border-radius:9px; background:#edf3ff; color:#2563eb; font-size:12px; cursor:pointer; }
            #mydayContent .myday-continue button:focus-visible { outline:2px solid #2563eb; outline-offset:3px; }
            #mydayContent progress { display:block; width:100%; max-width:320px; height:5px; margin-top:8px; accent-color:#2563eb; }
            @media(max-width:480px) { #mydayContent .myday-continue { flex-wrap:wrap; } #mydayContent .myday-continue-copy { flex-basis:100%; } }
        `;
        document.head.appendChild(style);
    }
}

function selectMydayContinueTasks(taskList) {
    return taskList.filter(task => task.status !== "Done").slice().sort((a, b) => {
        const active = task => task.status === "In Progress" || task.status === "Blocked" || Number(task.progress) > 0 ? 0 : 1;
        const days = task => { const value = getDaysLeft(task.deadline); return Number.isFinite(value) ? value : 9999; };
        return active(a) - active(b) || days(a) - days(b);
    }).slice(0, 3);
}

function renderMydayContinueItem(task) {
    const escape = value => String(value ?? "").replace(/[&<>"']/g, character => ({
        "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[character]));
    const progress = Math.max(0, Math.min(100, Number(task.progress) || 0));
    return `<div class="myday-item myday-continue">
        <div class="myday-continue-copy">
            <div class="myday-item-title">${escape(task.name)}</div>
            <div class="myday-item-sub">${escape(task.status || "Not Started")} · ${progress}% · ${escape(task.deadline || "No deadline")}</div>
            <progress max="100" value="${progress}" aria-label="Task progress">${progress}%</progress>
        </div>
        <button type="button" data-myday-view="${escape(task.id)}">View task</button>
    </div>`;
}

function renderMydayTaskItem(task) {

    const deadline =
        getDeadlineStatus(task);

    return `

        <div class="myday-item" onclick="editTask(${task.id})">

            <div>
                <div class="myday-item-title">${task.name}</div>
                <div class="myday-item-sub">
                    ${task.progress || 0}% · ${task.deadline || "No deadline"}
                </div>
            </div>

            <span class="deadline-badge deadline-${deadline.type}">
                ${deadline.text}
            </span>

        </div>

    `;

}


// ============================================================
// KANBAN BOARD
// ============================================================

const KANBAN_STATUSES = [

    "Not Started",
    "In Progress",
    "Done",
    "Blocked"

];


let draggedTaskId = null;


function renderKanban() {

    const board = getElement("kanbanBoard");

    if (!board) return;

    board.innerHTML = "";

    KANBAN_STATUSES.forEach(status => {

        const column =
            document.createElement("div");

        column.className = "kanban-column";

        column.dataset.status = status;

        const columnTasks =
            tasks.filter(
                task => task.status === status
            );

        const cardsHtml =
            columnTasks.length === 0
                ? `<div class="kanban-empty">No tasks</div>`
                : columnTasks
                    .map(task => renderKanbanCard(task))
                    .join("");

        column.innerHTML = `

            <div class="kanban-column-title">
                <span>${status}</span>
                <span class="kanban-count">${columnTasks.length}</span>
            </div>

            ${cardsHtml}

        `;

        column.addEventListener("dragover", event => {

            event.preventDefault();

            column.classList.add("drag-over");

        });

        column.addEventListener("dragleave", () => {

            column.classList.remove("drag-over");

        });

        column.addEventListener("drop", event => {

            event.preventDefault();

            column.classList.remove("drag-over");

            if (draggedTaskId === null) return;

            moveTaskToStatus(draggedTaskId, status);

        });

        board.appendChild(column);

    });


    board.querySelectorAll(".kanban-card").forEach(card => {

        card.addEventListener("dragstart", () => {

            draggedTaskId =
                Number(card.dataset.id);

            card.classList.add("dragging");

        });

        card.addEventListener("dragend", () => {

            card.classList.remove("dragging");

            draggedTaskId = null;

        });

        card.addEventListener("click", () => {

            editTask(
                Number(card.dataset.id)
            );

        });

    });

}


function renderKanbanCard(task) {

    const deadline =
        getDeadlineStatus(task);

    return `

        <div
            class="kanban-card"
            draggable="${isLecturer() ? "false" : "true"}"
            data-id="${task.id}"
        >

            <div class="kanban-card-title">
                ${task.name}
                ${getLecturerMarkingBadge(task)}
            </div>

            <div class="kanban-card-pic">
                👤 ${task.mainPIC || "-"}
            </div>

            <div class="kanban-card-bar">
                <div style="width:${task.progress || 0}%"></div>
            </div>

            <div class="kanban-card-deadline">
                ${deadline.text}
                ${task.deadline ? " · " + task.deadline : ""}
                ${Array.isArray(task.links) && task.links.length > 0 ? " · 🔗 " + task.links.length : ""}
            </div>

        </div>

    `;

}


function moveTaskToStatus(taskId, newStatus) {

    if (isLecturer()) {
        return;
    }

    const task =
        tasks.find(item => item.id === taskId);

    if (!task || task.status === newStatus) return;

    const oldStatus = task.status;

    task.status = newStatus;

    if (newStatus === "Done") {

        task.progress = 100;

    }

    else if (newStatus === "Not Started") {

        task.progress = 0;

    }

    saveData();

    logActivity(
        `moved task "${task.name}" from ${oldStatus} to ${newStatus}`
    );

    updateDashboard();

    renderTasks();

    renderTeam();

    renderCalendar();

    renderKanban();

}


// ============================================================
// TOGGLE TASK VIEW (Table / Board)
// ============================================================

function setTaskView(view) {

    const tableView =
        getElement("taskTableView");

    const boardView =
        getElement("taskBoardView");

    const tableBtn =
        getElement("viewToggleTable");

    const boardBtn =
        getElement("viewToggleBoard");

    if (!tableView || !boardView) return;

    if (view === "board") {

        tableView.classList.add("hidden");

        boardView.classList.remove("hidden");

        if (tableBtn) tableBtn.classList.remove("active");

        if (boardBtn) boardBtn.classList.add("active");

        renderKanban();

    }

    else {

        boardView.classList.add("hidden");

        tableView.classList.remove("hidden");

        if (boardBtn) boardBtn.classList.remove("active");

        if (tableBtn) tableBtn.classList.add("active");

    }

}


function listenToResources() {

    if (!db) {
        return;
    }

    db.collection(
        "trackerData"
    )
        .doc(
            "resources"
        )
        .onSnapshot(
            doc => {

                if (
                    doc.exists
                ) {

                    resources =
                        sanitizeStoredData(doc.data().list) ||
                        [];

                    const storedSections =
                        normalizeCustomResourceSections(
                            sanitizeStoredData(doc.data().sections) || []
                        );

                    // Backward-compatible recovery: if a resource already points to
                    // a non-standard section, keep that section visible even if the
                    // metadata field was not stored yet.
                    const sectionsFromResources =
                        resources
                            .map(item => sanitizeText(item && item.chapter ? item.chapter : ""))
                            .filter(name => name && !CHAPTERS.includes(name));

                    customResourceSections =
                        normalizeCustomResourceSections([
                            ...storedSections,
                            ...sectionsFromResources
                        ]);

                    const availableSections = [
                        ...CHAPTERS,
                        ...customResourceSections
                    ];

                    resourceSectionOrder =
                        normalizeResourceSectionOrder(
                            sanitizeStoredData(doc.data().sectionOrder) || [],
                            availableSections
                        );

                }

                else {

                    resources = [];
                    customResourceSections = [];
                    resourceSectionOrder = [...CHAPTERS];

                }

                renderChapters();

                syncBackupToSheet("resources", resources);

            },
            error => {

                console.error(
                    "Resources sync error:",
                    error
                );

            }
        );

}


function saveResourcesData() {

    if (!db) {

        showToast(
            "Firebase not configured yet — changes won't be saved. Ask the project owner to set up Firebase."
        );

        return;

    }

    db.collection(
        "trackerData"
    )
        .doc(
            "resources"
        )
        .set({
            list: resources,
            sections: normalizeCustomResourceSections(customResourceSections),
            sectionOrder: getResourceSections()
        }, { merge: true })
        .catch(
            error => {

                console.error(
                    "Save resources failed:",
                    error
                );

                showToast(
                    "❌ Save failed: " +
                    error.message +
                    "\n\nCheck Firestore Rules — the passcode may not match, or check your internet connection."
                );

            }
        );

}


function populateChapterSelect(
    selected = ""
) {

    const select =
        getElement(
            "resourceChapter"
        );

    if (!select) {
        return;
    }

    select.innerHTML = "";

    getResourceSections().forEach(
        chapter => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                chapter;

            option.textContent =
                chapter;

            if (
                chapter === selected
            ) {

                option.selected =
                    true;

            }

            select.appendChild(
                option
            );

        }
    );

}


// ============================================================
// RESOURCE SECTIONS (custom sections after Chapter 1-10)
// ============================================================

function openResourceSectionModal(sectionName = "") {

    if (isLecturer()) {
        showToast("View-only access — lecturers cannot manage resource sections.");
        return;
    }

    const modal = getElement("resourceSectionModal");
    const input = getElement("resourceSectionName");
    const oldInput = getElement("resourceSectionOldName");
    const title = getElement("resourceSectionModalTitle");
    const deleteBtn = getElement("deleteResourceSectionBtn");
    const moveUpBtn = getElement("moveResourceSectionUpBtn");
    const moveDownBtn = getElement("moveResourceSectionDownBtn");

    if (!modal || !input || !oldInput || !title) return;

    const isEdit = customResourceSections.includes(sectionName);

    oldInput.value = isEdit ? sectionName : "";
    input.value = isEdit ? sectionName : "";
    title.textContent = isEdit ? "Manage Section" : "Add Section";

    if (deleteBtn) {
        deleteBtn.classList.toggle("hidden", !isEdit);
    }

    const orderedSections = getResourceSections();
    const position = orderedSections.indexOf(sectionName);

    if (moveUpBtn) {
        moveUpBtn.classList.toggle("hidden", !isEdit);
        moveUpBtn.disabled = !isEdit || position <= 0;
    }

    if (moveDownBtn) {
        moveDownBtn.classList.toggle("hidden", !isEdit);
        moveDownBtn.disabled = !isEdit || position < 0 || position >= orderedSections.length - 1;
    }

    modal.classList.remove("hidden");

    setTimeout(() => {
        input.focus();
        input.select();
    }, 0);

}


function closeResourceSectionModal() {

    const modal = getElement("resourceSectionModal");

    if (modal) {
        modal.classList.add("hidden");
    }

}


function saveResourceSection(event) {

    event.preventDefault();

    if (isLecturer()) {
        showToast("View-only access — lecturers cannot manage resource sections.");
        closeResourceSectionModal();
        return;
    }

    const input = getElement("resourceSectionName");
    const oldInput = getElement("resourceSectionOldName");

    if (!input || !oldInput) return;

    const newName = sanitizeText(input.value).slice(0, 60);
    const oldName = sanitizeText(oldInput.value);

    if (!newName) {
        showToast("Please enter a section name.");
        return;
    }

    const duplicate = getResourceSections().some(section =>
        section.toLowerCase() === newName.toLowerCase() &&
        section.toLowerCase() !== oldName.toLowerCase()
    );

    if (duplicate) {
        showToast("That section already exists.");
        return;
    }

    if (oldName) {

        const index = customResourceSections.findIndex(
            section => section === oldName
        );

        if (index === -1) {
            showToast("Only custom sections can be renamed.");
            return;
        }

        customResourceSections[index] = newName;

        resourceSectionOrder = resourceSectionOrder.map(section =>
            section === oldName ? newName : section
        );

        resources = resources.map(item =>
            item.chapter === oldName
                ? { ...item, chapter: newName }
                : item
        );

        openChapters = openChapters.map(section =>
            section === oldName ? newName : section
        );

        logActivity(`renamed resource section "${oldName}" to "${newName}"`);

    }

    else {

        customResourceSections.push(newName);

        if (!resourceSectionOrder.includes(newName)) {
            resourceSectionOrder.push(newName);
        }

        if (!openChapters.includes(newName)) {
            openChapters.push(newName);
        }

        logActivity(`added resource section "${newName}"`);

    }

    customResourceSections =
        normalizeCustomResourceSections(customResourceSections);

    resourceSectionOrder =
        normalizeResourceSectionOrder(
            resourceSectionOrder,
            [...CHAPTERS, ...customResourceSections]
        );

    saveResourcesData();
    renderChapters();
    closeResourceSectionModal();

    showToast(oldName ? "Section renamed." : "Section added.");

}


function moveResourceSection(direction) {

    if (isLecturer()) {
        showToast("View-only access — lecturers cannot manage resource sections.");
        return;
    }

    const oldInput = getElement("resourceSectionOldName");
    const sectionName = sanitizeText(oldInput ? oldInput.value : "");

    if (!sectionName || !customResourceSections.includes(sectionName)) {
        showToast("Only custom sections can be repositioned.");
        return;
    }

    const ordered = getResourceSections();
    const currentIndex = ordered.indexOf(sectionName);
    const nextIndex = direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= ordered.length) {
        return;
    }

    [ordered[currentIndex], ordered[nextIndex]] =
        [ordered[nextIndex], ordered[currentIndex]];

    resourceSectionOrder = ordered;

    saveResourcesData();
    renderChapters();
    openResourceSectionModal(sectionName);

    showToast(direction === "up" ? "Section moved up." : "Section moved down.");

}


function deleteResourceSection() {

    if (isLecturer()) {
        showToast("View-only access — lecturers cannot manage resource sections.");
        return;
    }

    const oldInput = getElement("resourceSectionOldName");
    const sectionName = sanitizeText(oldInput ? oldInput.value : "");

    if (!sectionName || !customResourceSections.includes(sectionName)) {
        showToast("Only custom sections can be deleted.");
        return;
    }

    const itemCount = resources.filter(item => item.chapter === sectionName).length;

    if (itemCount > 0) {
        showToast(
            `This section still contains ${itemCount} resource${itemCount === 1 ? "" : "s"}. Move or delete them first.`
        );
        return;
    }

    if (!confirm(`Delete empty section "${sectionName}"?`)) {
        return;
    }

    customResourceSections = customResourceSections.filter(
        section => section !== sectionName
    );

    resourceSectionOrder = resourceSectionOrder.filter(
        section => section !== sectionName
    );

    openChapters = openChapters.filter(
        section => section !== sectionName
    );

    saveResourcesData();
    renderChapters();
    closeResourceSectionModal();

    logActivity(`deleted resource section "${sectionName}"`);
    showToast("Section deleted.");

}


function openResourceModal(
    resource = null
) {

    const modal =
        getElement(
            "resourceModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "hidden"
    );

    if (
        resource
    ) {

        getElement(
            "resourceModalTitle"
        ).textContent =
            "Edit File / Link";

        getElement(
            "resourceId"
        ).value =
            resource.id;

        populateChapterSelect(
            resource.chapter
        );

        getElement(
            "resourceTitle"
        ).value =
            resource.title || "";

        getElement(
            "resourceUrl"
        ).value =
            resource.url || "";

        getElement(
            "resourceNotes"
        ).value =
            resource.notes || "";

        const currentFileLabel =
            getElement(
                "currentResourceFile"
            );

        if (currentFileLabel) {

            currentFileLabel.textContent =
                resource.fileName
                    ? "Current file: " +
                      resource.fileName
                    : "";

        }

        const fileInputEdit =
            getElement(
                "resourceFile"
            );

        if (fileInputEdit) {

            fileInputEdit.value = "";

        }

        currentCommentResourceId = resource.id;

        const resourceCommentsSection = getElement("resourceCommentsSection");

        if (resourceCommentsSection) {

            resourceCommentsSection.classList.remove("hidden");

        }

        renderResourceComments(resource);

    }

    else {

        currentCommentResourceId = null;

        const resourceCommentsSectionNew = getElement("resourceCommentsSection");

        if (resourceCommentsSectionNew) {

            resourceCommentsSectionNew.classList.add("hidden");

        }

        getElement(
            "resourceModalTitle"
        ).textContent =
            "Add File / Link";

        getElement(
            "resourceId"
        ).value =
            "";

        populateChapterSelect(
            getResourceSections()[0] || CHAPTERS[0]
        );

        getElement(
            "resourceTitle"
        ).value =
            "";

        getElement(
            "resourceUrl"
        ).value =
            "";

        getElement(
            "resourceNotes"
        ).value =
            "";

        const currentFileLabelNew =
            getElement(
                "currentResourceFile"
            );

        if (currentFileLabelNew) {

            currentFileLabelNew.textContent = "";

        }

        const fileInputNew =
            getElement(
                "resourceFile"
            );

        if (fileInputNew) {

            fileInputNew.value = "";

        }

    }

    const progressWrap =
        getElement(
            "uploadProgressWrap"
        );

    if (progressWrap) {

        progressWrap.classList.add(
            "hidden"
        );

    }

    setModalFieldsDisabled("resourceModal", isLecturer());

    populateReviewStatusSelect(
        "resourceReviewStatus",
        resource ? (resource.reviewStatus || "none") : "none"
    );

    const reviewSaveBtn = getElement("resourceReviewSaveBtn");

    if (reviewSaveBtn) {

        reviewSaveBtn.style.display = isLecturer() ? "" : "none";

    }

    const resourceCommentInputField = getElement("resourceCommentInput");

    if (resourceCommentInputField) {

        resourceCommentInputField.disabled = false;

    }

}


function closeResourceModal() {

    const modal =
        getElement(
            "resourceModal"
        );

    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}



function getResourceAttribution(oldResource, hasNewFile, actor, timestamp) {
    const previous = oldResource || {};
    return {
        createdBy: previous.createdBy || (!oldResource ? actor : ""),
        createdAt: previous.createdAt || (!oldResource ? timestamp : ""),
        uploadedBy: hasNewFile ? actor : (previous.uploadedBy || ""),
        uploadedAt: hasNewFile ? timestamp : (previous.uploadedAt || ""),
        updatedBy: actor,
        updatedAt: timestamp
    };
}

function resourceAttributionText(item) {
    const formatDate = value => {
        if (!value) return "";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur"
        });
    };
    const isFile = Boolean(item.fileName);
    const actor = isFile ? item.uploadedBy : item.createdBy;
    const timestamp = isFile ? item.uploadedAt : item.createdAt;
    const date = formatDate(timestamp);
    let text = actor ? (isFile ? "Uploaded by " : "Added by ") + actor : (isFile ? "Uploader not recorded" : "Added by not recorded");
    if (date) text += " · " + date;
    if (item.updatedAt && item.updatedAt !== timestamp && item.updatedBy) {
        text += " · Updated by " + item.updatedBy;
        const updated = formatDate(item.updatedAt);
        if (updated) text += " · " + updated;
    }
    return text;
}

async function saveResource(event) {

    event.preventDefault();

    if (isLecturer()) {

        showToast("View-only access — lecturers cannot edit resources.");

        closeResourceModal();

        return;

    }

    const id =
        getElement(
            "resourceId"
        ).value;

    const title =
        sanitizeText(
            getElement(
                "resourceTitle"
            ).value
        );

    if (!title) {

        showToast(
            "Please enter a Title."
        );

        return;

    }

    const oldResource =
        id
            ? resources.find(
                item =>
                    item.id == id
            )
            : null;

    const fileInput =
        getElement(
            "resourceFile"
        );

    const hasNewFile =
        fileInput &&
        fileInput.files.length > 0;

    let fileUrl =
        getElement(
            "resourceUrl"
        ).value.trim();

    let fileName =
        oldResource
            ? oldResource.fileName || ""
            : "";

    if (
        hasNewFile
    ) {

        if (!storage) {

            showToast(
                "File upload isn't set up yet (Firebase Storage not configured). Please use a Link instead, or ask the project owner to set up Storage."
            );

            return;

        }

        const file =
            fileInput.files[0];

        fileName =
            file.name;

        try {

            fileUrl =
                await uploadResourceFile(
                    file
                );

        }

        catch (error) {

            console.error(
                "Upload failed:",
                error
            );

            showToast(
                "❌ File upload failed: " +
                error.message
            );

            return;

        }

    }

    const selectedResourceSection =
        getElement(
            "resourceChapter"
        ).value;

    if (!getResourceSections().includes(selectedResourceSection)) {

        showToast("Please choose a valid resource section.");
        return;

    }

    const resourceData = {
        ...getResourceAttribution(oldResource, Boolean(hasNewFile), getCurrentUser() || "", new Date().toISOString()),


        chapter:
            selectedResourceSection,

        title:
            title,

        url:
            fileUrl,

        fileName:
            fileName,

        notes:
            getElement(
                "resourceNotes"
            ).value.trim(),

        reviewStatus:
            oldResource
                ? (oldResource.reviewStatus || "none")
                : "none"

    };

    if (
        id
    ) {

        const index =
            resources.findIndex(
                item =>
                    item.id == id
            );

        if (
            index !== -1
        ) {

            resources[index] = {
                ...oldResource,

                id:
                    Number(id),

                ...resourceData

            };

        }

    }

    else {

        resources.push({

            id:
                Date.now(),

            ...resourceData

        });

    }

    saveResourcesData();

    logActivity(
        (id ? "updated resource " : "added resource ") +
        `"${resourceData.title}"`
    );

    closeResourceModal();

}


// ============================================================
// UPLOAD FILE TO FIREBASE STORAGE (with progress bar)
// ============================================================

function uploadResourceFile(file) {

    return new Promise(
        (resolve, reject) => {

            const progressWrap =
                getElement(
                    "uploadProgressWrap"
                );

            const progressFill =
                getElement(
                    "uploadProgressFill"
                );

            const progressText =
                getElement(
                    "uploadProgressText"
                );

            if (progressWrap) {

                progressWrap.classList.remove(
                    "hidden"
                );

            }

            const safeName =
                Date.now() +
                "_" +
                file.name.replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );

            const storageRef =
                storage
                    .ref()
                    .child(
                        "resources/" +
                        safeName
                    );

            const uploadTask =
                storageRef.put(
                    file
                );

            uploadTask.on(
                "state_changed",
                snapshot => {

                    const percent =
                        Math.round(
                            (
                                snapshot.bytesTransferred /
                                snapshot.totalBytes
                            ) * 100
                        );

                    if (progressFill) {

                        progressFill.style.width =
                            percent + "%";

                    }

                    if (progressText) {

                        progressText.textContent =
                            "Uploading... " +
                            percent +
                            "%";

                    }

                },
                error => {

                    if (progressWrap) {

                        progressWrap.classList.add(
                            "hidden"
                        );

                    }

                    reject(
                        error
                    );

                },
                () => {

                    uploadTask.snapshot.ref
                        .getDownloadURL()
                        .then(
                            downloadUrl => {

                                if (progressWrap) {

                                    progressWrap.classList.add(
                                        "hidden"
                                    );

                                }

                                resolve(
                                    downloadUrl
                                );

                            }
                        )
                        .catch(
                            reject
                        );

                }
            );

        }
    );

}


function uploadTaskFile(file) {

    return new Promise(
        (resolve, reject) => {

            const progressWrap =
                getElement("taskUploadProgressWrap");

            const progressFill =
                getElement("taskUploadProgressFill");

            const progressText =
                getElement("taskUploadProgressText");

            if (progressWrap) {

                progressWrap.classList.remove("hidden");

            }

            const safeName =
                Date.now() +
                "_" +
                file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

            const storageRef =
                storage.ref().child("taskFiles/" + safeName);

            const uploadTask =
                storageRef.put(file);

            uploadTask.on(
                "state_changed",
                snapshot => {

                    const percent =
                        Math.round(
                            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                        );

                    if (progressFill) {

                        progressFill.style.width = percent + "%";

                    }

                    if (progressText) {

                        progressText.textContent =
                            "Uploading... " + percent + "%";

                    }

                },
                error => {

                    if (progressWrap) {

                        progressWrap.classList.add("hidden");

                    }

                    reject(error);

                },
                () => {

                    uploadTask.snapshot.ref
                        .getDownloadURL()
                        .then(downloadUrl => {

                            if (progressWrap) {

                                progressWrap.classList.add("hidden");

                            }

                            resolve(downloadUrl);

                        })
                        .catch(reject);

                }
            );

        }
    );

}


function editResource(id) {

    const resource =
        resources.find(
            item =>
                item.id === id
        );

    if (resource) {

        openResourceModal(
            resource
        );

    }

}


function deleteResource(id) {

    if (isLecturer()) {

        showToast("View-only access — lecturers cannot delete resources.");

        return;

    }

    const resource =
        resources.find(
            item =>
                item.id === id
        );

    if (!resource) {
        return;
    }

    if (!isGroupLeader()) {

        requestDelete("resource", id, resource.title || "Untitled resource");

        return;

    }

    if (
        !confirm(
            "Delete this file/link?"
        )
    ) {

        return;

    }

    performDeleteResourceById(id);

}


function performDeleteResourceById(id) {

    const deletedResource =
        resources.find(
            item =>
                item.id === id
        );

    resources =
        resources.filter(
            item =>
                item.id !== id
        );

    saveResourcesData();

    logActivity(
        `deleted resource "${deletedResource ? deletedResource.title : ""}"`
    );

    renderChapters();

    return deletedResource;

}



let resourceSearchQuery = "";
const resourceSearchCollapsed = new Set();

function resourceMatchesSearch(item, chapter, query) {
    const terms = String(query || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
    const text = [chapter, item.title, item.fileName, item.url]
        .map(value => String(value || "").toLowerCase()).join(" ");
    return terms.every(term => text.includes(term));
}

function ensureResourceSearch(container) {
    if (getElement("resourceSearchBar")) return;
    const bar = document.createElement("div");
    bar.id = "resourceSearchBar";
    bar.innerHTML = `
        <label for="resourceSearchInput">Search resources</label>
        <div class="resource-search-controls">
            <input id="resourceSearchInput" type="search" placeholder="Search files, links or sections…" autocomplete="off">
            <button id="resourceSearchClear" type="button" hidden>Clear</button>
        </div>
        <p id="resourceSearchStatus" role="status" aria-live="polite" aria-atomic="true"></p>
    `;
    container.before(bar);
    const style = document.createElement("style");
    style.textContent = `
        #resourceSearchBar { margin:0 0 18px; }
        #resourceSearchBar label { display:block; font-size:12px; font-weight:600; color:#526179; margin-bottom:7px; }
        #resourceSearchBar .resource-search-controls { display:flex; gap:8px; max-width:580px; }
        #resourceSearchBar input { width:100%; min-width:0; padding:11px 13px; border:1px solid #dfe6f0; border-radius:10px; background:#fff; color:#16192b; font:inherit; font-size:13px; }
        #resourceSearchBar button { padding:9px 14px; border:1px solid #dfe6f0; border-radius:10px; background:#f6f8fc; color:#2563eb; font:inherit; font-size:12px; cursor:pointer; }
        #resourceSearchBar input:focus-visible, #resourceSearchBar button:focus-visible { outline:2px solid #2563eb; outline-offset:2px; }
        #resourceSearchStatus { margin:7px 0 0; color:#68768d; font-size:11px; min-height:16px; }
        #resources .resource-search-empty { padding:24px; text-align:center; border:1px dashed #dfe6f0; border-radius:12px; color:#68768d; font-size:13px; }
    `;
    bar.appendChild(style);
    getElement("resourceSearchInput").addEventListener("input", event => {
        resourceSearchQuery = event.target.value;
        resourceSearchCollapsed.clear();
        renderChapters();
    });
    getElement("resourceSearchClear").addEventListener("click", () => {
        resourceSearchQuery = "";
        resourceSearchCollapsed.clear();
        getElement("resourceSearchInput").value = "";
        renderChapters();
        getElement("resourceSearchInput").focus();
    });
}

function toggleChapter(
    chapterName
) {
    if (resourceSearchQuery.trim()) {
        if (resourceSearchCollapsed.has(chapterName)) resourceSearchCollapsed.delete(chapterName);
        else resourceSearchCollapsed.add(chapterName);
        renderChapters();
        return;
    }


    if (
        openChapters.includes(
            chapterName
        )
    ) {

        openChapters =
            openChapters.filter(
                name =>
                    name !== chapterName
            );

    }

    else {

        openChapters.push(
            chapterName
        );

    }

    renderChapters();

}


function renderChapters() {

    const container =
        getElement(
            "chapterList"
        );

    if (!container) {
        return;
    }

    ensureResourceSearch(container);
    const query = resourceSearchQuery.trim();
    let matchingItems = 0;
    let matchingSections = 0;
    getElement("resourceSearchClear").hidden = !resourceSearchQuery;
    container.innerHTML = "";

    getResourceSections().forEach(
        (chapter, index) => {

            const chapterResources =
                resources.filter(
                    item =>
                        item.chapter === chapter && (!query || resourceMatchesSearch(item, chapter, query))
                );

            if (query && !chapterResources.length && !resourceMatchesSearch({}, chapter, query)) return;
            matchingItems += chapterResources.length;
            matchingSections += 1;

            const isOpen = query ? !resourceSearchCollapsed.has(chapter) :
                openChapters.includes(
                    chapter
                );

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "chapter-card" +
                (
                    isOpen
                        ? " open"
                        : ""
                );

            const itemsHtml =
                chapterResources.length === 0
                    ? `<div class="chapter-empty">No files or links yet.</div>`
                    : chapterResources
                        .map(
                            item => `

                                <div class="resource-item">

                                    <div class="resource-icon">
                                        ${item.fileName ? "📎" : "🔗"}
                                    </div>

                                    <div class="resource-info">

                                        ${
                                            item.url
                                                ? `<a href="${item.url}" target="_blank" rel="noopener">${item.title}</a>`
                                                : `<strong>${item.title}</strong>`
                                        }

                                        ${renderReviewBadge(item.reviewStatus)}

                                        ${
                                            item.fileName
                                                ? `<small>📎 ${item.fileName}</small>`
                                                : ""
                                        }

                                        ${
                                            item.notes
                                                ? `<small>${item.notes}</small>`
                                                : ""
                                        }

                                    </div>

                                    <div class="resource-actions">

                                        <button
                                            class="edit-btn"
                                            onclick="editResource(${item.id})"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            class="delete-btn"
                                            onclick="deleteResource(${item.id})"
                                        >
                                            Delete
                                        </button>

                                    </div>

                                </div>

                            `
                        )
                        .join("");

            card.innerHTML = `

                <div
                    class="chapter-header"
                    onclick="toggleChapter('${chapter}')"
                >

                    <div class="chapter-header-left">

                        <div class="chapter-badge">
                            ${index + 1}
                        </div>

                        <div>

                            <div class="chapter-title">
                                ${chapter}
                            </div>

                            <div class="chapter-count">
                                ${chapterResources.length}
                                item${chapterResources.length === 1 ? "" : "s"}
                            </div>

                        </div>

                    </div>

                    <div class="resource-section-header-actions">

                        ${customResourceSections.includes(chapter) && !isLecturer() ? `
                            <button
                                type="button"
                                class="resource-section-menu-btn"
                                title="Rename or delete section"
                                aria-label="Manage ${chapter}"
                            >
                                •••
                            </button>
                        ` : ""}

                        <div class="chapter-chevron">
                            ▶
                        </div>

                    </div>

                </div>

                <div class="chapter-body">
                    ${itemsHtml}
                </div>

            `;

            // Mark uploaded files for the shared preview; external links keep their normal behavior.
            card.querySelectorAll(".resource-item").forEach((row, itemIndex) => {
                const item = chapterResources[itemIndex];
                const info = row.querySelector(".resource-info");
                if (info) {
                    const metadata = document.createElement("small");
                    metadata.className = "resource-attribution";
                    metadata.textContent = resourceAttributionText(item);
                    metadata.style.display = "block";
                    metadata.style.marginTop = "5px";
                    info.appendChild(metadata);
                }
                const link = row.querySelector(".resource-info a");
                if (link && item.fileName) {
                    link.classList.add("resource-file-preview");
                    link.dataset.previewName = item.fileName;
                    link.title = "Preview " + item.fileName;
                }
            });

            const manageSectionBtn =
                card.querySelector(
                    ".resource-section-menu-btn"
                );

            if (manageSectionBtn) {

                manageSectionBtn.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();
                        openResourceSectionModal(chapter);

                    }
                );

            }

            container.appendChild(
                card
            );

        }
    );

    getElement("resourceSearchStatus").textContent = query
        ? matchingItems + " result" + (matchingItems === 1 ? "" : "s") + " in " + matchingSections + " section" + (matchingSections === 1 ? "" : "s")
        : "";
    if (query && !matchingSections) {
        const empty = document.createElement("div");
        empty.className = "resource-search-empty";
        empty.textContent = "No matching resources. Try another name or clear your search.";
        container.appendChild(empty);
    }
}

// ============================================================
// MEETING ATTENDEE CHECKBOXES (in modal)
// ============================================================

function renderMeetingAttendeeCheckboxes(
    selected = []
) {

    const container =
        getElement(
            "meetingAttendeeCheckboxes"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    members.forEach(
        member => {

            const checked =
                selected.includes(
                    member.name
                );

            container.innerHTML += `

                <label
                    class="member-option"
                    style="
                        display:flex;
                        gap:8px;
                        align-items:center;
                        margin:8px 0;
                    "
                >

                    <input
                        type="checkbox"
                        name="meetingAttendee"
                        value="${member.name}"
                        ${checked ? "checked" : ""}
                    >

                    <span>
                        ${member.name}
                    </span>

                </label>

            `;

        }
    );

}


// ============================================================
// MEETING → CHAPTER / EQUIPMENT LINK
// ============================================================

function populateMeetingChapterSelect(selected = "Unassigned") {

    const select = getElement("meetingChapter");

    if (!select) return;

    const options = ["Unassigned", ...CHAPTERS];

    select.innerHTML = "";

    options.forEach(chapter => {

        const option = document.createElement("option");
        option.value = chapter;
        option.textContent = chapter === "Unassigned"
            ? "Unassigned / General Meeting"
            : chapter;
        option.selected = chapter === selected;
        select.appendChild(option);

    });

    if (!options.includes(selected)) select.value = "Unassigned";

}


function populateMeetingWorkPackageSelect(chapter, selected = "") {

    const select = getElement("meetingWorkPackage");

    if (!select) return;

    const names = [...new Set(
        tasks
            .filter(task => chapter !== "Unassigned" && getTaskChapter(task) === chapter)
            .map(getTaskWorkPackage)
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    select.innerHTML = `<option value="">Whole Chapter / General</option>`;

    names.forEach(name => {

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        select.appendChild(option);

    });

    if (selected && !names.includes(selected)) {

        const option = document.createElement("option");
        option.value = selected;
        option.textContent = selected;
        select.appendChild(option);

    }

    select.value = selected || "";

}


function setupMeetingProjectLinkEvents() {

    const chapterSelect = getElement("meetingChapter");

    if (!chapterSelect || chapterSelect.dataset.phase2Bound === "1") return;

    chapterSelect.dataset.phase2Bound = "1";

    chapterSelect.addEventListener("change", () => {
        populateMeetingWorkPackageSelect(chapterSelect.value, "");
    });

}


// ============================================================
// OPEN / CLOSE MEETING MODAL
// ============================================================


function validMeetingUrl(value) {
    const text = String(value || "").trim();
    if (!text || !/^https:\/\//i.test(text) || /[\s<>"`]/.test(text)) return "";
    try {
        const url = new URL(text);
        return url.protocol === "https:" && url.hostname && !url.username && !url.password ? url.href : "";
    } catch (_) { return ""; }
}

function getMeetingJoinUrl(meeting) {
    return validMeetingUrl(meeting.meetingUrl === undefined ? meeting.location : meeting.meetingUrl);
}

function prepareMeetingLinkField(meeting) {
    const location = getElement("meetingLocation");
    if (!location) return;
    if (!getElement("meetingUrl")) {
        const label = document.createElement("label");
        label.textContent = "Online meeting link (optional)";
        const help = document.createElement("span");
        help.className = "label-help";
        help.textContent = "Paste an https:// Google Meet, Teams or Zoom link.";
        const input = document.createElement("input");
        input.id = "meetingUrl";
        input.type = "url";
        input.placeholder = "https://meet.google.com/...";
        label.append(help, input);
        location.closest("label").after(label);
    }
    getElement("meetingUrl").value = meeting ? getMeetingJoinUrl(meeting) : "";
}

function renderMeetingJoinLink(meeting) {
    const url = getMeetingJoinUrl(meeting);
    if (!url) return "";
    const safe = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return '<a class="meeting-join-btn" href="' + safe + '" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;padding:9px 14px;border-radius:9px;background:#2563eb;color:white;font-size:12px;font-weight:700;text-decoration:none">Join meeting ↗</a>';
}

function openMeetingModal(
    meeting = null,
    prefill = null
) {

    const modal =
        getElement(
            "meetingModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "hidden"
    );

    prepareMeetingLinkField(meeting);

    // Lecturer boleh TAMBAH meeting baru, tapi tak boleh EDIT meeting sedia ada
    const lockForLecturer =
        isLecturer() && !!meeting;

    setModalFieldsDisabled(
        "meetingModal",
        lockForLecturer
    );

    const meetingSaveBtn =
        modal.querySelector(".save-btn");

    if (meetingSaveBtn) {

        meetingSaveBtn.style.display =
            lockForLecturer ? "none" : "";

    }

    if (
        meeting
    ) {

        getElement(
            "meetingModalTitle"
        ).textContent =
            "Edit Meeting";

        getElement(
            "meetingId"
        ).value =
            meeting.id;

        getElement(
            "meetingTitle"
        ).value =
            meeting.title || "";

        getElement(
            "meetingDate"
        ).value =
            meeting.date || "";

        getElement(
            "meetingTime"
        ).value =
            meeting.time || "";

        getElement(
            "meetingLocation"
        ).value =
            meeting.location || "";

        getElement(
            "meetingNotes"
        ).value =
            meeting.notes || "";

        const relatedChapter = sanitizeText(meeting.relatedChapter || "Unassigned");
        const relatedWorkPackage = sanitizeText(meeting.relatedWorkPackage || "");

        populateMeetingChapterSelect(
            CHAPTERS.includes(relatedChapter) ? relatedChapter : "Unassigned"
        );

        populateMeetingWorkPackageSelect(
            CHAPTERS.includes(relatedChapter) ? relatedChapter : "Unassigned",
            relatedWorkPackage
        );

        renderMeetingAttendeeCheckboxes(
            meeting.attendees || []
        );

    }

    else {

        getElement(
            "meetingModalTitle"
        ).textContent =
            "Add Meeting";

        getElement(
            "meetingId"
        ).value =
            "";

        getElement(
            "meetingTitle"
        ).value =
            "";

        getElement(
            "meetingDate"
        ).value =
            "";

        getElement(
            "meetingTime"
        ).value =
            "";

        getElement(
            "meetingLocation"
        ).value =
            "";

        getElement(
            "meetingNotes"
        ).value =
            "";

        const prefillChapter =
            prefill && CHAPTERS.includes(prefill.relatedChapter)
                ? prefill.relatedChapter
                : "Unassigned";

        const prefillWorkPackage =
            prefill ? sanitizeText(prefill.relatedWorkPackage || "") : "";

        populateMeetingChapterSelect(prefillChapter);
        populateMeetingWorkPackageSelect(prefillChapter, prefillWorkPackage);

        renderMeetingAttendeeCheckboxes();

    }

    const agenda = getElement("meetingAgenda");
    if (agenda) agenda.open = Boolean(meeting && meeting.notes);
    const scroller = modal.querySelector(".meeting-form-scroll");
    if (scroller) scroller.scrollTop = 0;
    // Move a legacy online link into its dedicated field when editing.
    if (meeting && meeting.meetingUrl === undefined && validMeetingUrl(meeting.location)) {
        getElement("meetingLocation").value = "";
    }
}

function selectAllMeetingAttendees() {
    document.querySelectorAll('#meetingAttendeeCheckboxes input[name="meetingAttendee"]').forEach(input => {
        if (!input.disabled) input.checked = true;
    });
}

function closeMeetingModal() {

    const modal =
        getElement(
            "meetingModal"
        );

    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}


// ============================================================
// SAVE MEETING
// ============================================================

function saveMeeting(event) {

    event.preventDefault();

    const id =
        getElement(
            "meetingId"
        ).value;

    if (isLecturer() && id) {

        showToast("View-only access — lecturers cannot edit existing meetings.");

        closeMeetingModal();

        return;

    }

    const attendees =
        Array.from(
            document.querySelectorAll(
                'input[name="meetingAttendee"]:checked'
            )
        ).map(
            checkbox =>
                checkbox.value
        );

    const title =
        sanitizeText(
            getElement(
                "meetingTitle"
            ).value
        );

    const date =
        getElement(
            "meetingDate"
        ).value;

    if (!title) {

        showToast(
            "Please enter Meeting Title."
        );

        return;

    }

    if (!date) {

        showToast(
            "Please select a Meeting Date."
        );

        return;

    }

    const oldMeeting =
        id
            ? meetings.find(
                meeting =>
                    meeting.id == id
            )
            : null;

    const rawMeetingUrl = getElement("meetingUrl")?.value.trim() || "";
    const meetingUrl = validMeetingUrl(rawMeetingUrl);
    if (rawMeetingUrl && !meetingUrl) {
        showToast("Please enter a valid https:// meeting link without spaces or login credentials.", "warning");
        getElement("meetingUrl")?.focus();
        return;
    }

    const meetingData = {
        meetingUrl: meetingUrl,

        title:
            title,

        date:
            date,

        time:
            getElement(
                "meetingTime"
            ).value,

        location:
            getElement(
                "meetingLocation"
            ).value.trim(),

        notes:
            getElement(
                "meetingNotes"
            ).value.trim(),

        relatedChapter:
            getElement("meetingChapter") && CHAPTERS.includes(getElement("meetingChapter").value)
                ? getElement("meetingChapter").value
                : "Unassigned",

        relatedWorkPackage:
            getElement("meetingWorkPackage")
                ? sanitizeText(getElement("meetingWorkPackage").value)
                : "",

        attendees:
            attendees,

        attended:
            oldMeeting
                ? oldMeeting.attended || []
                : [],

        mom:
            oldMeeting
                ? oldMeeting.mom || null
                : null

    };

    if (
        id
    ) {

        const index =
            meetings.findIndex(
                meeting =>
                    meeting.id == id
            );

        if (
            index !== -1
        ) {

            meetings[index] = {

                id:
                    Number(id),

                ...meetingData

            };

        }

    }

    else {

        meetings.push({

            id:
                Date.now(),

            ...meetingData

        });

    }

    saveMeetingsData();

    logActivity(
        (id ? "updated meeting " : "created meeting ") +
        `"${meetingData.title}"`
    );

    renderMeetings();

    renderCalendar();

    closeMeetingModal();

}


// ============================================================
// EDIT / DELETE MEETING
// ============================================================

function editMeeting(id) {

    const meeting =
        meetings.find(
            meeting =>
                meeting.id === id
        );

    if (meeting) {

        openMeetingModal(
            meeting
        );

    }

}


function deleteMeeting(id) {

    if (isLecturer()) {

        showToast("View-only access — lecturers cannot delete meetings.");

        return;

    }

    const meeting =
        meetings.find(
            meeting =>
                meeting.id === id
        );

    if (!meeting) {
        return;
    }

    if (!isGroupLeader()) {

        requestDelete("meeting", id, meeting.title || "Untitled meeting");

        return;

    }

    if (
        !confirm(
            "Delete this meeting?"
        )
    ) {

        return;

    }

    performDeleteMeetingById(id);

}


function performDeleteMeetingById(id) {

    const deletedMeeting =
        meetings.find(
            meeting =>
                meeting.id === id
        );

    meetings =
        meetings.filter(
            meeting =>
                meeting.id !== id
        );

    saveMeetingsData();

    logActivity(
        `deleted meeting "${deletedMeeting ? deletedMeeting.title : ""}"`
    );

    renderMeetings();

    renderCalendar();

    return deletedMeeting;

}


// ============================================================
// TOGGLE ATTENDANCE (actual attendance, from meeting card)
// ============================================================

function toggleAttendance(
    meetingId,
    memberName
) {

    if (isLecturer()) {

        showToast("View-only access — lecturers cannot mark attendance.");

        renderMeetings();

        return;

    }

    const meeting =
        meetings.find(
            item =>
                item.id === meetingId
        );

    if (!meeting) {
        return;
    }

    if (
        !Array.isArray(
            meeting.attended
        )
    ) {

        meeting.attended = [];

    }

    if (
        meeting.attended.includes(
            memberName
        )
    ) {

        meeting.attended =
            meeting.attended.filter(
                name =>
                    name !== memberName
            );

    }

    else {

        meeting.attended.push(
            memberName
        );

    }

    saveMeetingsData();

    renderMeetings();

}


// ============================================================
// MEETING TIMING STATUS
// ============================================================

function getMeetingStatus(
    meeting
) {

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    const meetingDate =
        new Date(
            meeting.date +
            "T00:00:00"
        );

    if (
        meetingDate.getTime() ===
        today.getTime()
    ) {

        return {
            type: "today",
            text: "TODAY"
        };

    }

    if (
        meetingDate.getTime() >
        today.getTime()
    ) {

        return {
            type: "upcoming",
            text: "UPCOMING"
        };

    }

    return {
        type: "past",
        text: "PAST"
    };

}


// ============================================================
// RENDER MEETINGS
// ============================================================


function renderMeetings() {
    const container = getElement("meetingList");
    if (!container) return;
    const expandedAttendance = new Set(Array.from(container.querySelectorAll("[data-meeting-attendance][open]"), node => node.dataset.meetingAttendance));
    const pastOpen = Boolean(container.querySelector(".meeting-history")?.open);
    const styles = `<style>
        #meetingList .meeting-empty-compact { display:flex; align-items:center; gap:14px; padding:24px 18px; border:1px dashed #dfe6ef; border-radius:12px; background:#fafbfd; }
        #meetingList .meeting-empty-icon { display:grid; place-items:center; width:40px; height:40px; flex-shrink:0; border-radius:10px; background:#edf3ff; font-size:20px; }
        #meetingList .meeting-empty-compact h4 { margin:0 0 5px; font-size:14px; }
        #meetingList .meeting-empty-compact p, #meetingList .meeting-none { margin:0; color:#718096; font-size:12px; line-height:1.6; }
        #meetingList .meeting-group-heading { display:flex; align-items:center; gap:9px; margin:0 0 12px; font-size:14px; }
        #meetingList .meeting-group-count { padding:3px 8px; background:#f0f4fa; border-radius:20px; color:#64748b; font-size:11px; font-weight:600; }
        #meetingList .meeting-group-list { display:grid; gap:12px; }
        #meetingList .meeting-history { margin-top:8px; border-top:1px solid #e5ebf3; padding-top:16px; }
        #meetingList .meeting-history > summary { padding:7px 0; font-size:13px; font-weight:650; color:#526179; cursor:pointer; }
        #meetingList .meeting-history > summary:focus-visible { outline:2px solid #2563eb; outline-offset:4px; }
        #meetingList .meeting-history .meeting-group-list { margin-top:12px; }
        #meetingList .meeting-card.meeting-past { opacity:1; background:#fafbfd; }
    </style>`;
    if (!meetings.length) {
        container.innerHTML = styles + '<div class="meeting-empty-compact"><span class="meeting-empty-icon" aria-hidden="true">🗓️</span><div><h4>No meetings scheduled</h4><p>' +
            (isLecturer() ? 'Scheduled team meetings will appear here.' : 'Use Add Meeting above to schedule your first team discussion.') +
            '</p></div></div>';
        return;
    }
    const sorted = [...meetings].sort((a, b) =>
        `${a.date}T${a.time || "00:00"}`.localeCompare(`${b.date}T${b.time || "00:00"}`));
    const upcoming = sorted.filter(meeting => getMeetingStatus(meeting).type !== "past");
    const past = sorted.filter(meeting => getMeetingStatus(meeting).type === "past").reverse();
    container.innerHTML = styles +
        '<section><h3 class="meeting-group-heading">Upcoming <span class="meeting-group-count">' + upcoming.length + '</span></h3>' +
        (upcoming.length ? '<div class="meeting-group-list">' + upcoming.map(renderMeetingListCard).join("") + '</div>' : '<p class="meeting-none">No upcoming meetings scheduled.</p>') + '</section>' +
        (past.length ? '<details class="meeting-history"' + (pastOpen ? ' open' : '') + '><summary>Past meetings · ' + past.length + '</summary><div class="meeting-group-list">' + past.map(renderMeetingListCard).join("") + '</div></details>' : '');
    container.querySelectorAll("[data-meeting-attendance]").forEach(node => {
        node.open = expandedAttendance.has(node.dataset.meetingAttendance);
    });
}

function renderMeetingListCard(meeting) {
            const status =
                getMeetingStatus(
                    meeting
                );

            const attendees =
                meeting.attendees || [];

            const attended =
                meeting.attended || [];

            return `

                <div class="meeting-card ${status.type === "past" ? "meeting-past" : ""}">

                    <div class="meeting-top">

                        <div>

                            <h3>
                                📌 ${meeting.title}
                            </h3>

                            <div class="meeting-when">
                                📅 ${meeting.date}
                                ${meeting.time ? " · " + meeting.time : ""}
                            </div>

                            ${
                                meeting.location
                                    ? `
                                        <div class="meeting-location">
                                            📍 ${meeting.location}
                                        </div>
                                    `
                                    : ""
                            }

                            ${
                                CHAPTERS.includes(meeting.relatedChapter)
                                    ? `
                                        <div class="meeting-project-tags">
                                            <span>📚 ${meeting.relatedChapter}</span>
                                            ${meeting.relatedWorkPackage ? `<span>⚙️ ${meeting.relatedWorkPackage}</span>` : ""}
                                        </div>
                                    `
                                    : ""
                            }

                        </div>

                        <span class="meeting-badge ${status.type}">
                            ${status.text}
                        </span>

                    </div>

                    ${
                        meeting.notes
                            ? `<div class="meeting-notes">${meeting.notes}</div>`
                            : ""
                    }

                    ${attendees.length ? `
                        <details class="meeting-attendance-details" data-meeting-attendance="${meeting.id}">
                            <summary>Attendance <span>${attended.filter(name => attendees.includes(name)).length}/${attendees.length} attended</span></summary>
                        <div class="attendee-check-row">

                            ${
                                attendees.length === 0
                                    ? "<small>No attendees selected.</small>"
                                    : attendees
                                        .map(
                                            name => `
                                                <label class="attendee-check-item">

                                                    <input
                                                        type="checkbox"
                                                        ${attended.includes(name) ? "checked" : ""}
                                                        ${isLecturer() ? "disabled" : ""}
                                                        onchange="toggleAttendance(${meeting.id}, '${name}')"
                                                    >

                                                    <span>
                                                        ${name}
                                                    </span>

                                                </label>
                                            `
                                        )
                                        .join("")
                            }

                        </div>


                        </details>
                    ` : '<p class="meeting-no-attendees">No attendees added</p>'}

                    ${
                        meeting.mom && meeting.mom.summary
                            ? `<div class="mom-badge">📝 Minutes recorded</div>`
                            : ""
                    }

                    <div class="meeting-actions">
                        ${renderMeetingJoinLink(meeting)}

                        <button
                            class="edit-btn"
                            onclick="openMomModal(${meeting.id})"
                        >
                            📝 ${meeting.mom && meeting.mom.summary ? "Minutes" : "Add Minutes"}
                        </button>

                        <details class="meeting-overflow">
                            <summary aria-label="More meeting actions" title="More actions">⋯</summary>
                            <div class="meeting-overflow-panel">
                        <button
                            class="edit-btn"
                            onclick="this.closest('details').open=false; editMeeting(${meeting.id})"
                        >
                            Edit
                        </button>

                        <button
                            class="delete-btn"
                            onclick="this.closest('details').open=false; deleteMeeting(${meeting.id})"
                        >
                            Delete
                        </button>


                            </div>
                        </details>
                    </div>

                </div>

            `;

}

// ============================================================
// MINUTES OF MEETING (MOM)
// ============================================================
//
// Setiap meeting boleh ada satu set "Minutes" — ringkasan
// perbincangan + senarai Action Items (dengan owner & status).
// Action items boleh terus "Convert to Task" supaya masuk
// terus dalam Tasks page tanpa perlu taip semula.
// ============================================================

let currentMomMeetingId = null;

let currentMomActionItems = [];

let pendingMomConversion = null;


function populateMomOwnerSelect(selected = "") {

    const select = getElement("momActionOwner");

    if (!select) return;

    select.innerHTML = `<option value="">Select PIC</option>`;

    members.forEach(member => {

        const option = document.createElement("option");

        option.value = member.name;

        option.textContent = member.name;

        if (member.name === selected) {

            option.selected = true;

        }

        select.appendChild(option);

    });

}


function openMomModal(meetingId) {

    const meeting = meetings.find(item => item.id === meetingId);

    if (!meeting) return;

    currentMomMeetingId = meetingId;

    const modal = getElement("momModal");

    if (!modal) return;

    modal.classList.remove("hidden");

    getElement("momModalTitle").textContent =
        "Minutes of Meeting";

    const infoEl = getElement("momMeetingInfo");

    if (infoEl) {

        infoEl.innerHTML = `
            📌 ${meeting.title}
            <small>
                📅 ${meeting.date}${meeting.time ? " · " + meeting.time : ""}
                ${meeting.location ? " · 📍 " + meeting.location : ""}
                ${CHAPTERS.includes(meeting.relatedChapter) ? " · 📚 " + meeting.relatedChapter : ""}
                ${meeting.relatedWorkPackage ? " · ⚙️ " + meeting.relatedWorkPackage : ""}
            </small>
        `;

    }

    getElement("momMeetingId").value = meetingId;

    getElement("momSummary").value =
        (meeting.mom && meeting.mom.summary) || "";

    currentMomActionItems =
        ((meeting.mom && meeting.mom.actionItems) || []).map(
            item => ({ ...item })
        );

    populateMomOwnerSelect();

    renderMomActionItems();
    const scroller = modal.querySelector(".mom-form-scroll");
    if (scroller) scroller.scrollTop = 0;

    const metaEl = getElement("momMeta");

    if (metaEl) {

        if (meeting.mom && meeting.mom.updatedBy) {

            metaEl.textContent =
                `Last updated by ${meeting.mom.updatedBy} on ${formatActivityTime(meeting.mom.updatedAt)}`;

            metaEl.classList.remove("hidden");

        }

        else {

            metaEl.classList.add("hidden");

        }

    }

    setModalFieldsDisabled("momModal", isLecturer());

    const addBtn = getElement("momActionAddBtn");

    if (addBtn) addBtn.style.display = isLecturer() ? "none" : "";

    const saveBtn = getElement("momSaveBtn");

    if (saveBtn) saveBtn.style.display = isLecturer() ? "none" : "";

}


function closeMomModal() {

    const modal = getElement("momModal");

    if (modal) {

        modal.classList.add("hidden");

    }

    currentMomMeetingId = null;

    currentMomActionItems = [];

}


function renderMomActionItems() {

    const container = getElement("momActionList");

    if (!container) return;

    container.innerHTML = "";

    if (currentMomActionItems.length === 0) {

        container.innerHTML =
            `<div class="chapter-empty">No action items yet.</div>`;

        return;

    }

    currentMomActionItems.forEach((item, index) => {

        const row = document.createElement("div");

        row.className = "mom-action-item";

        row.innerHTML = `

            <input
                type="checkbox"
                ${item.done ? "checked" : ""}
                data-index="${index}"
                class="mom-action-check"
            >

            <span class="mom-action-text ${item.done ? "done-text" : ""}">
                ${item.text}
            </span>

            ${
                item.owner
                    ? `<span class="mom-action-owner-tag">👤 ${item.owner}</span>`
                    : ""
            }

            <button
                type="button"
                class="mom-action-convert-btn"
                data-index="${index}"
                title="${item.taskId ? "Already converted to a task" : "Convert to Task"}"
                ${item.taskId ? "disabled" : ""}
            >
                ${item.taskId ? "✓" : "→T"}
            </button>

            <button
                type="button"
                class="subtask-remove-btn"
                data-index="${index}"
            >
                ✕
            </button>

        `;

        container.appendChild(row);

    });

    container.querySelectorAll(".mom-action-check").forEach(checkbox => {

        checkbox.addEventListener("change", event => {

            const index = Number(event.target.dataset.index);

            currentMomActionItems[index].done = event.target.checked;

            renderMomActionItems();

        });

    });

    container.querySelectorAll(".mom-action-convert-btn").forEach(button => {

        button.addEventListener("click", event => {

            const index = Number(event.currentTarget.dataset.index);

            convertMomActionToTask(index);

        });

    });

    container.querySelectorAll(".subtask-remove-btn").forEach(button => {

        button.addEventListener("click", event => {

            const index = Number(event.currentTarget.dataset.index);

            currentMomActionItems.splice(index, 1);

            renderMomActionItems();

        });

    });

}


function addMomActionFromInput() {

    const input = getElement("momActionInput");

    const ownerSelect = getElement("momActionOwner");

    if (!input) return;

    const text = input.value.trim();

    if (!text) return;

    currentMomActionItems.push({

        id: Date.now() + Math.random(),

        text: text,

        owner: ownerSelect ? ownerSelect.value : "",

        done: false,

        taskId: null

    });

    input.value = "";

    renderMomActionItems();

    input.focus();

}


function setupMomEvents() {

    const addButton = getElement("momActionAddBtn");

    if (addButton) {

        addButton.addEventListener("click", addMomActionFromInput);

    }

    const input = getElement("momActionInput");

    if (input) {

        input.addEventListener("keydown", event => {

            if (event.key === "Enter") {

                event.preventDefault();

                addMomActionFromInput();

            }

        });

    }

}


function convertMomActionToTask(index) {

    if (isLecturer()) {

        showToast("View-only access — lecturers cannot create tasks.");

        return;

    }

    const item = currentMomActionItems[index];

    if (!item || item.taskId) return;

    const meetingId = currentMomMeetingId;

    const meeting = meetings.find(m => m.id === meetingId);

    // Persist the current minutes first so this action item (and its
    // id) is guaranteed to exist in `meeting.mom`, even if the user
    // hasn't hit "Save Minutes" yet - otherwise there'd be nothing to
    // link the new task back to once the Add Task modal closes.
    if (meeting) {

        meeting.mom = {

            summary: sanitizeText(getElement("momSummary").value),

            actionItems: currentMomActionItems,

            updatedBy: getCurrentUser() || "Unknown",

            updatedAt: new Date().toISOString()

        };

        saveMeetingsData();

    }

    pendingMomConversion = {

        meetingId: meetingId,

        actionItemId: item.id,

        actionText: item.text

    };

    closeMomModal();

    // Open the normal Add Task modal, pre-filled but NOT yet saved -
    // this forces the same required fields (Main PIC, deadline, etc.)
    // as any other task, instead of silently creating a task with a
    // blank deadline that then shows a confusing "9999 days" badge.
    openTaskModal(null, {

        name: item.text,

        chapter:
            meeting && CHAPTERS.includes(meeting.relatedChapter)
                ? meeting.relatedChapter
                : "Unassigned",

        workPackage:
            meeting ? sanitizeText(meeting.relatedWorkPackage || "") : "",

        mainPIC: item.owner || "",

        assigned: item.owner ? [item.owner] : []

    });

    showToast("Finish filling in the task details (PIC, deadline, etc.) and save.", "warning");

}


function linkMomConversionToTask(taskId, taskName) {

    if (!pendingMomConversion) return;

    const meeting = meetings.find(m => m.id === pendingMomConversion.meetingId);

    if (meeting && meeting.mom && Array.isArray(meeting.mom.actionItems)) {

        const item = meeting.mom.actionItems.find(

            entry => entry.id === pendingMomConversion.actionItemId

        );

        if (item) {

            item.taskId = taskId;

            saveMeetingsData();

        }

    }

    // Keep the in-memory copy in sync too, in case the MOM modal for
    // this meeting gets reopened later in the same session.
    if (currentMomMeetingId === pendingMomConversion.meetingId) {

        const liveItem = currentMomActionItems.find(

            entry => entry.id === pendingMomConversion.actionItemId

        );

        if (liveItem) {

            liveItem.taskId = taskId;

        }

    }

    logActivity(
        `linked task "${taskName}" to meeting minutes action item`
    );

    pendingMomConversion = null;

}


function saveMom(event) {

    event.preventDefault();

    if (isLecturer()) {

        showToast("View-only access — lecturers cannot edit minutes.");

        closeMomModal();

        return;

    }

    const meetingId = Number(getElement("momMeetingId").value);

    const meeting = meetings.find(item => item.id === meetingId);

    if (!meeting) {

        closeMomModal();

        return;

    }

    meeting.mom = {

        summary: sanitizeText(getElement("momSummary").value),

        actionItems: currentMomActionItems,

        updatedBy: getCurrentUser() || "Unknown",

        updatedAt: new Date().toISOString()

    };

    saveMeetingsData();

    logActivity(`updated minutes of meeting for "${meeting.title}"`);

    renderMeetings();

    closeMomModal();

    showToast("Minutes of meeting saved!");

}


function getMomPdfFilename(meeting) {
    const title = String(meeting.title || "Meeting").replace(/[^a-zA-Z0-9]/g, "_");
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(meeting.date || ""));
    let dateLabel = "DATE NOT SET";
    if (parts) {
        const year = Number(parts[1]), month = Number(parts[2]), day = Number(parts[3]);
        const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
        if (month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1]) {
            dateLabel = day + " " + months[month - 1] + " " + parts[1];
        }
    }
    return title + "_Minutes_" + dateLabel + ".pdf";
}

function exportMomPdf() {

    if (typeof window.jspdf === "undefined") {

        showToast("PDF library failed to load. Please check your internet connection and try again.");

        return;

    }

    const meetingId = Number(getElement("momMeetingId").value);

    const meeting = meetings.find(item => item.id === meetingId);

    if (!meeting) {

        showToast("Meeting not found.");

        return;

    }

    const summaryText = getElement("momSummary").value.trim();

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();

    const pageHeight = doc.internal.pageSize.getHeight();

    const margin = 15;

    const contentWidth = pageWidth - margin * 2;

    const primary = [37, 99, 235];

    const violet = [124, 58, 237];

    const dark = [22, 25, 43];

    const muted = [124, 132, 150];

    const border = [231, 235, 243];

    const grayBg = [241, 242, 247];


    function checkPageBreak(neededSpace, y) {

        if (y + neededSpace > pageHeight - 20) {

            doc.addPage();

            return 20;

        }

        return y;

    }


    // HEADER

    doc.setFillColor(...primary);

    doc.rect(0, 0, pageWidth, 34, "F");

    doc.setFillColor(...violet);

    doc.circle(pageWidth - 10, -6, 22, "F");

    doc.setTextColor(255, 255, 255);

    doc.setFontSize(17);

    doc.setFont(undefined, "bold");

    doc.text("Minutes of Meeting", margin, 17);

    doc.setFontSize(10);

    doc.setFont(undefined, "normal");

    doc.text(meeting.title, margin, 25);

    doc.setFontSize(8.5);

    doc.text(`Generated ${new Date().toLocaleString()}`, margin, 31);


    let y = 46;


    // MEETING INFO CARD

    doc.setFillColor(...grayBg);

    doc.roundedRect(margin, y, contentWidth, 24, 3, 3, "F");

    doc.setTextColor(...dark);

    doc.setFontSize(9.5);

    doc.setFont(undefined, "bold");

    doc.text("Date:", margin + 6, y + 9);

    doc.text("Location:", margin + 6, y + 18);

    doc.setFont(undefined, "normal");

    doc.setTextColor(...muted);

    doc.text(`${meeting.date}${meeting.time ? "  " + meeting.time : ""}`, margin + 28, y + 9);

    doc.text(meeting.location || "-", margin + 28, y + 18);

    doc.setFont(undefined, "bold");

    doc.setTextColor(...dark);

    doc.text("Attendees:", margin + 100, y + 9);

    doc.setFont(undefined, "normal");

    doc.setTextColor(...muted);

    const attendedNames = (meeting.attended || []).join(", ") || "None recorded";

    doc.text(
        doc.splitTextToSize(attendedNames, contentWidth - 130),
        margin + 130,
        y + 9
    );

    y += 32;


    // SUMMARY

    doc.setTextColor(...dark);

    doc.setFontSize(12.5);

    doc.setFont(undefined, "bold");

    doc.text("Discussion Summary", margin, y);

    y += 3;

    doc.setDrawColor(...primary);

    doc.setLineWidth(0.8);

    doc.line(margin, y, margin + 24, y);

    doc.setLineWidth(0.2);

    y += 8;

    doc.setFontSize(9.5);

    doc.setFont(undefined, "normal");

    doc.setTextColor(...dark);

    const summaryLines = doc.splitTextToSize(
        summaryText || "No summary recorded.",
        contentWidth
    );

    summaryLines.forEach(line => {

        y = checkPageBreak(6, y);

        doc.text(line, margin, y);

        y += 5.5;

    });

    y += 8;


    // ACTION ITEMS

    y = checkPageBreak(30, y);

    doc.setTextColor(...dark);

    doc.setFontSize(12.5);

    doc.setFont(undefined, "bold");

    doc.text("Action Items", margin, y);

    y += 3;

    doc.setDrawColor(...violet);

    doc.setLineWidth(0.8);

    doc.line(margin, y, margin + 24, y);

    doc.setLineWidth(0.2);

    y += 9;

    if (currentMomActionItems.length === 0) {

        doc.setFontSize(9.5);

        doc.setFont(undefined, "italic");

        doc.setTextColor(...muted);

        doc.text("No action items recorded.", margin, y);

        y += 8;

    }

    else {
        const bottom = pageHeight - 20;
        const lineHeight = 4.5;
        const padding = 3;
        const ownerX = margin + 130;
        const statusX = margin + contentWidth - 3;
        const actionWidth = 124;
        const ownerWidth = Math.max(12, contentWidth - 155);
        const freshCapacity = Math.floor((bottom - 28 - padding * 2) / lineHeight);

        function drawActionHeader() {
            doc.setFillColor(...dark);
            doc.rect(margin, y, contentWidth, 8, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont(undefined, "bold");
            doc.text("ACTION ITEM", margin + 3, y + 5.5);
            doc.text("OWNER", ownerX, y + 5.5);
            doc.text("STATUS", statusX, y + 5.5, { align: "right" });
            y += 8;
        }

        function nextActionPage() {
            doc.addPage();
            y = 20;
            drawActionHeader();
        }

        drawActionHeader();
        currentMomActionItems.forEach((item, index) => {
            doc.setFontSize(8.5);
            doc.setFont(undefined, "normal");
            const actionLines = doc.splitTextToSize(String(item.text || "-"), actionWidth);
            const ownerLines = doc.splitTextToSize(String(item.owner || "-"), ownerWidth);
            const totalLines = Math.max(actionLines.length, ownerLines.length, 1);
            const fullHeight = totalLines * lineHeight + padding * 2;
            // Keep a row together when it can fit on one fresh page.
            if (totalLines <= freshCapacity && y + fullHeight > bottom) nextActionPage();
            let offset = 0;
            while (offset < totalLines) {
                let capacity = Math.floor((bottom - y - padding * 2) / lineHeight);
                if (capacity < 1) {
                    nextActionPage();
                    capacity = freshCapacity;
                }
                const count = Math.min(capacity, totalLines - offset);
                const rowHeight = count * lineHeight + padding * 2;
                if (index % 2 === 0) {
                    doc.setFillColor(249, 250, 252);
                    doc.rect(margin, y, contentWidth, rowHeight, "F");
                }
                doc.setFontSize(8.5);
                doc.setFont(undefined, "normal");
                for (let line = 0; line < count; line++) {
                    const baseline = y + padding + 3 + line * lineHeight;
                    if (actionLines[offset + line] !== undefined) {
                        doc.setTextColor(...dark);
                        doc.text(actionLines[offset + line], margin + 3, baseline);
                    }
                    if (ownerLines[offset + line] !== undefined) {
                        doc.setTextColor(...muted);
                        doc.text(ownerLines[offset + line], ownerX, baseline);
                    }
                }
                doc.setTextColor(item.done ? 34 : 217, item.done ? 197 : 119, item.done ? 94 : 6);
                doc.setFont(undefined, "bold");
                doc.text(item.done ? "DONE" : "PENDING", statusX, y + padding + 3, { align: "right" });
                y += rowHeight;
                offset += count;
                if (offset < totalLines) nextActionPage();
            }
            doc.setDrawColor(...border);
            doc.line(margin, y, margin + contentWidth, y);
        });
        y += 10;
    }

    // FOOTER

    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {

        doc.setPage(i);

        doc.setDrawColor(...border);

        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        doc.setFontSize(7.5);

        doc.setFont(undefined, "normal");

        doc.setTextColor(...muted);

        doc.text("Design Project Group Tracker — Confidential", margin, pageHeight - 9);

        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 9, { align: "right" });

    }


    doc.save(getMomPdfFilename(meeting));

    logActivity(`exported minutes of meeting PDF for "${meeting.title}"`);

}


// ============================================================
// LECTURER REVIEW STATUS (Tasks & Resources)
// ============================================================
//
// Only the lecturer account can set this. Options: none / approved /
// minor (needs minor revision) / major (needs major revision).
// Shown as a badge in the Tasks table and Resources chapter list so
// the team can see at a glance what's been flagged without opening
// each item.
// ============================================================

const REVIEW_STATUS_META = {

    none: { label: "Not Reviewed", short: "Not Reviewed", cls: "review-none" },

    approved: { label: "✅ Approved", short: "Approved", cls: "review-approved" },

    minor: { label: "🟡 Needs Minor Revision", short: "Minor Revision", cls: "review-minor" },

    major: { label: "🔴 Needs Major Revision", short: "Major Revision", cls: "review-major" }

};


function getReviewStatusMeta(status) {

    return REVIEW_STATUS_META[status] || REVIEW_STATUS_META.none;

}


function renderReviewBadge(status) {

    if (!status || status === "none") return "";

    const meta = getReviewStatusMeta(status);

    return `<span class="review-badge ${meta.cls}">${meta.label}</span>`;

}


function populateReviewStatusSelect(elementId, currentStatus) {

    const select = getElement(elementId);

    if (!select) return;

    select.value = currentStatus || "none";

    select.disabled = !isLecturer();

}


function setTaskReviewStatus() {

    if (!isLecturer()) {

        showToast("Only the lecturer account can set a review status.");

        return;

    }

    const taskId = Number(getElement("taskId").value);

    const task = tasks.find(item => item.id === taskId);

    if (!task) return;

    const select = getElement("taskReviewStatus");

    const newStatus = select ? select.value : "none";

    task.reviewStatus = newStatus;

    saveData();

    logActivity(
        `marked task "${task.name}" as ${getReviewStatusMeta(newStatus).short}`
    );

    const recipients = new Set();

    if (task.mainPIC) recipients.add(task.mainPIC);

    (task.assigned || []).forEach(name => recipients.add(name));

    if (recipients.size > 0) {

        addNotification({
            text: `🎓 <strong>Lecturer</strong> marked task "${task.name}" as ${getReviewStatusMeta(newStatus).short}`,
            forUsers: Array.from(recipients),
            relatedType: "task",
            relatedId: task.id
        });

    }

    renderTasks();

    renderKanban();

    showToast("Review status saved.");

}


function setResourceReviewStatus() {

    if (!isLecturer()) {

        showToast("Only the lecturer account can set a review status.");

        return;

    }

    const resourceId = Number(getElement("resourceId").value);

    const resource = resources.find(item => item.id === resourceId);

    if (!resource) return;

    const select = getElement("resourceReviewStatus");

    const newStatus = select ? select.value : "none";

    resource.reviewStatus = newStatus;

    saveResourcesData();

    logActivity(
        `marked resource "${resource.title}" as ${getReviewStatusMeta(newStatus).short}`
    );

    const recipients =
        members.map(member => member.name);

    if (recipients.length > 0) {

        addNotification({
            text: `🎓 <strong>Lecturer</strong> marked "${resource.title}" (${resource.chapter}) as ${getReviewStatusMeta(newStatus).short}`,
            forUsers: recipients,
            relatedType: "resource",
            relatedId: resource.id
        });

    }

    renderChapters();

    showToast("Review status saved.");

}


// ============================================================
// SUBTASK CHECKLIST STATE (modal-scoped, temporary)
// ============================================================

let currentSubtasks = [];

let currentLinks = [];


// ============================================================
// GET SUBTASK STATS
// ============================================================

// ============================================================
// LECTURER MARKING (approve / needs revision / not acceptable)
// ============================================================

const MARKING_STATUSES = {
    not_reviewed: { label: "Not Reviewed", icon: "⚪", cls: "marking-none" },
    approved: { label: "Approved", icon: "✅", cls: "marking-approved" },
    needs_revision: { label: "Needs Revision", icon: "🟡", cls: "marking-revision" },
    not_acceptable: { label: "Not Acceptable", icon: "🔴", cls: "marking-reject" }
};

function getMarkingInfo(status) {
    return MARKING_STATUSES[status] || MARKING_STATUSES.not_reviewed;
}

function getLecturerMarkingBadge(task) {

    const marking = task.lecturerMarking;

    if (!marking || !marking.status || marking.status === "not_reviewed") {
        return "";
    }

    const info = getMarkingInfo(marking.status);

    return `<span class="marking-badge ${info.cls}">${info.icon} ${info.label}</span>`;

}


// ============================================================
// LECTURER MARKING ACTION BUTTON (Tasks table, Action column)
// ============================================================
//
// Lecturer role has no Edit/Delete access, so the Action column
// would otherwise render empty for them. Instead show one button
// that jumps straight into the task modal (which is already
// reordered to show the Lecturer Marking section first for the
// lecturer role) so they can mark it immediately.
// ============================================================

function getLecturerMarkingActionButton(task) {

    const marking = task.lecturerMarking;

    const status = (marking && marking.status) || "not_reviewed";

    const info = getMarkingInfo(status);

    const label =
        status === "not_reviewed"
            ? "🎓 Mark Now"
            : `🎓 ${info.icon} ${info.label}`;

    return `
        <button
            class="lecturer-mark-btn ${info.cls}"
            onclick="editTask(${task.id})"
        >
            ${label}
        </button>
    `;

}


function populateMarkingStatusSelect(selected = "not_reviewed") {

    const select = getElement("taskMarkingStatus");

    if (!select) return;

    select.innerHTML = "";

    Object.entries(MARKING_STATUSES).forEach(([value, info]) => {

        const option = document.createElement("option");

        option.value = value;

        option.textContent = `${info.icon} ${info.label}`;

        if (value === selected) option.selected = true;

        select.appendChild(option);

    });

    renderMarkingSegmentedControl(selected);

}


// ============================================================
// MARKING SEGMENTED CONTROL (replaces the raw <select> with big
// clickable status buttons — clicking one updates the hidden
// <select> so saveLecturerMarking() keeps working unchanged.)
// ============================================================

function renderMarkingSegmentedControl(selected = "not_reviewed") {

    const container = getElement("markingSegmentedControl");

    if (!container) return;

    container.innerHTML = Object.entries(MARKING_STATUSES).map(([value, info]) => `
        <button
            type="button"
            class="marking-seg-btn ${info.cls} ${value === selected ? "active" : ""}"
            data-value="${value}"
        >
            <span class="marking-seg-icon">${info.icon}</span>
            <span class="marking-seg-label">${info.label}</span>
        </button>
    `).join("");

    const disabled = !isLecturer();

    container.querySelectorAll(".marking-seg-btn").forEach(button => {

        button.disabled = disabled;

        button.addEventListener("click", () => {

            if (disabled) return;

            const select = getElement("taskMarkingStatus");

            if (select) select.value = button.dataset.value;

            container.querySelectorAll(".marking-seg-btn").forEach(item => {

                item.classList.toggle("active", item === button);

            });

        });

    });

}


// ============================================================
// MARKING HISTORY COLLAPSE TOGGLE
// ============================================================

function toggleMarkingHistory() {

    const list = getElement("taskMarkingHistory");

    const icon = getElement("markingHistoryToggleIcon");

    if (!list) return;

    const isHidden = list.classList.contains("hidden");

    list.classList.toggle("hidden");

    if (icon) icon.textContent = isHidden ? "▾" : "▸";

}


function renderMarkingHistory(task) {

    const container = getElement("taskMarkingHistory");

    if (!container) return;

    const marking = task.lecturerMarking;

    const history = (marking && marking.history) || [];

    if (history.length === 0) {

        container.innerHTML = `<div class="chapter-empty">No previous markings.</div>`;

        return;

    }

    container.innerHTML = [...history].reverse().map(entry => {

        const info = getMarkingInfo(entry.status);

        return `
            <div class="marking-history-item">
                <span class="marking-badge ${info.cls}">${info.icon} ${info.label}</span>
                ${entry.remarks ? `<div class="marking-history-remarks">${entry.remarks}</div>` : ""}
                <div class="marking-history-meta">${formatActivityTime(entry.time)}</div>
            </div>
        `;

    }).join("");

}

function renderTaskMarkingSection(task) {

    const statusEl = getElement("taskMarkingStatus");

    const remarksEl = getElement("taskMarkingRemarks");

    const marking = task && task.lecturerMarking;

    populateMarkingStatusSelect(marking ? marking.status : "not_reviewed");

    if (remarksEl) {

        remarksEl.value = marking ? marking.remarks || "" : "";

    }

    renderMarkingHistory(task);

    const historyList = getElement("taskMarkingHistory");

    const historyIcon = getElement("markingHistoryToggleIcon");

    if (historyList) historyList.classList.add("hidden");

    if (historyIcon) historyIcon.textContent = "▸";

    const saveBtn = getElement("taskMarkingSaveBtn");

    if (saveBtn) {

        saveBtn.style.display = isLecturer() ? "" : "none";

    }

    if (remarksEl) remarksEl.disabled = !isLecturer();

}

function saveLecturerMarking() {

    if (!isLecturer()) {

        showToast("Only the lecturer can set marking status.");

        return;

    }

    const taskIdField = getElement("taskId");

    const taskId = taskIdField ? Number(taskIdField.value) : NaN;

    const task = tasks.find(item => item.id === taskId);

    if (!task) {

        showToast("Please save the task first before marking it.");

        return;

    }

    const statusEl = getElement("taskMarkingStatus");

    const remarksEl = getElement("taskMarkingRemarks");

    const newStatus = statusEl ? statusEl.value : "not_reviewed";

    const newRemarks = remarksEl ? sanitizeText(remarksEl.value) : "";

    const existingHistory =
        (task.lecturerMarking && Array.isArray(task.lecturerMarking.history))
            ? task.lecturerMarking.history
            : [];

    existingHistory.push({
        status: newStatus,
        remarks: newRemarks,
        markedBy: getCurrentUser() || "Lecturer",
        time: new Date().toISOString()
    });

    task.lecturerMarking = {
        status: newStatus,
        remarks: newRemarks,
        markedBy: getCurrentUser() || "Lecturer",
        markedAt: new Date().toISOString(),
        history: existingHistory
    };

    saveData();

    logActivity(`marked task "${task.name}" as ${getMarkingInfo(newStatus).label}`);

    const recipients = new Set();

    if (task.mainPIC) recipients.add(task.mainPIC);

    (task.assigned || []).forEach(name => recipients.add(name));

    if (recipients.size > 0) {

        addNotification({
            text: `<strong>Lecturer</strong> marked task "${task.name}" as <strong>${getMarkingInfo(newStatus).label}</strong>`,
            forUsers: Array.from(recipients),
            relatedType: "task",
            relatedId: task.id
        });

    }

    renderTaskMarkingSection(task);

    renderTasks();

    renderKanban();

    updateDashboard();

    showToast("Marking saved.");

}


function getMarkingCounts() {

    const counts = { approved: 0, needs_revision: 0, not_acceptable: 0, not_reviewed: 0 };

    tasks.forEach(task => {

        const status = (task.lecturerMarking && task.lecturerMarking.status) || "not_reviewed";

        counts[status] = (counts[status] || 0) + 1;

    });

    return counts;

}


let filterLecturerStatusValue = "All";


function filterTasksByMarking(status) {

    showSection("tasks");

    const priorityFilter = getElement("filterPriority");

    if (priorityFilter) priorityFilter.value = "All";

    const statusFilter = getElement("filterStatus");

    if (statusFilter) statusFilter.value = "All";

    const memberFilter = getElement("filterMember");

    if (memberFilter) memberFilter.value = "All";

    filterLecturerStatusValue = status;

    renderTasks();

}


function renderMarkingOverview() {

    const panel = getElement("lecturerMarkingPanel");

    if (!panel) return;

    if (!isLecturer()) {

        panel.classList.add("hidden");

        return;

    }

    panel.classList.remove("hidden");

    const counts = getMarkingCounts();

    const grid = getElement("markingOverviewGrid");

    if (!grid) return;

    const items = [
        { key: "approved", label: "Approved", icon: "✅", cls: "marking-approved" },
        { key: "needs_revision", label: "Needs Revision", icon: "🟡", cls: "marking-revision" },
        { key: "not_acceptable", label: "Not Acceptable", icon: "🔴", cls: "marking-reject" },
        { key: "not_reviewed", label: "Not Reviewed", icon: "⚪", cls: "marking-none" }
    ];

    grid.innerHTML = items.map(item => `

        <button
            type="button"
            class="marking-stat-btn ${item.cls}"
            onclick="filterTasksByMarking('${item.key}')"
        >
            <strong>${counts[item.key] || 0}</strong>
            <span>${item.icon} ${item.label}</span>
        </button>

    `).join("");

}


// ============================================================
// GET SUBTASK STATS
// ============================================================

function getSubtaskStats(task) {

    const subtasks =
        (task && task.subtasks) || [];

    const total =
        subtasks.length;

    const done =
        subtasks.filter(
            item => item.done
        ).length;

    return {
        total,
        done
    };

}


// ============================================================
// RENDER SUBTASK LIST (inside modal)
// ============================================================

function renderSubtaskList() {

    const container =
        getElement(
            "subtaskList"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    currentSubtasks.forEach(
        (item, index) => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "subtask-item";

            row.innerHTML = `

                <input
                    type="checkbox"
                    ${item.done ? "checked" : ""}
                    data-index="${index}"
                    class="subtask-check"
                >

                <span class="${item.done ? "done-text" : ""}">
                    ${item.text}
                </span>

                <button
                    type="button"
                    class="subtask-remove-btn"
                    data-index="${index}"
                >
                    ✕
                </button>

            `;

            container.appendChild(
                row
            );

        }
    );

    container
        .querySelectorAll(
            ".subtask-check"
        )
        .forEach(
            checkbox => {

                checkbox.addEventListener(
                    "change",
                    event => {

                        const index =
                            Number(
                                event.target.dataset.index
                            );

                        currentSubtasks[index].done =
                            event.target.checked;

                        renderSubtaskList();

                    }
                );

            }
        );

    container
        .querySelectorAll(
            ".subtask-remove-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        const index =
                            Number(
                                event.currentTarget.dataset.index
                            );

                        currentSubtasks.splice(
                            index,
                            1
                        );

                        renderSubtaskList();

                    }
                );

            }
        );


    const label =
        getElement(
            "subtaskProgressLabel"
        );

    if (label) {

        if (
            currentSubtasks.length === 0
        ) {

            label.textContent =
                "No checklist items yet";

        }

        else {

            const doneCount =
                currentSubtasks.filter(
                    item => item.done
                ).length;

            label.textContent =
                `${doneCount}/${currentSubtasks.length} completed`;

        }

    }

}


// ============================================================
// ADD SUBTASK
// ============================================================

function addSubtaskFromInput() {

    const input =
        getElement(
            "subtaskInput"
        );

    if (!input) {
        return;
    }

    const text =
        input.value.trim();

    if (!text) {
        return;
    }

    currentSubtasks.push({

        id:
            Date.now() +
            Math.random(),

        text:
            text,

        done:
            false

    });

    input.value = "";

    renderSubtaskList();

    input.focus();

}


// ============================================================
// SETUP SUBTASK INPUT EVENTS
// ============================================================

function setupSubtaskEvents() {

    const addButton =
        getElement(
            "subtaskAddBtn"
        );

    if (addButton) {

        addButton.addEventListener(
            "click",
            addSubtaskFromInput
        );

    }

    const input =
        getElement(
            "subtaskInput"
        );

    if (input) {

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    addSubtaskFromInput();

                }

            }
        );

    }

}


// ============================================================
// MULTIPLE LINK ATTACHMENTS (per task)
// ============================================================

function renderLinksList() {

    const container =
        getElement("linksList");

    if (!container) return;

    container.innerHTML = "";

    if (currentLinks.length === 0) {

        container.innerHTML =
            `<div class="chapter-empty">No links added yet.</div>`;

        return;

    }

    currentLinks.forEach(
        (link, index) => {

            const row =
                document.createElement("div");

            row.className = "subtask-item";

            row.innerHTML = `

                <span>
                    🔗 <a href="${link.url}" target="_blank" rel="noopener">${link.label || link.url}</a>
                </span>

                <button
                    type="button"
                    class="subtask-remove-btn"
                    data-index="${index}"
                >
                    ✕
                </button>

            `;

            container.appendChild(row);

        }
    );

    container
        .querySelectorAll(".subtask-remove-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    const index =
                        Number(
                            event.currentTarget.dataset.index
                        );

                    currentLinks.splice(index, 1);

                    renderLinksList();

                }
            );

        });

}


function addLinkFromInput() {

    const labelInput =
        getElement("linkLabelInput");

    const urlInput =
        getElement("linkUrlInput");

    if (!urlInput) return;

    const url = urlInput.value.trim();

    if (!url) return;

    currentLinks.push({

        id: Date.now() + Math.random(),

        label: labelInput ? labelInput.value.trim() : "",

        url: url

    });

    urlInput.value = "";

    if (labelInput) labelInput.value = "";

    renderLinksList();

    urlInput.focus();

}


function setupLinkEvents() {

    const addButton =
        getElement("linkAddBtn");

    if (addButton) {

        addButton.addEventListener(
            "click",
            addLinkFromInput
        );

    }

    const urlInput =
        getElement("linkUrlInput");

    if (urlInput) {

        urlInput.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    addLinkFromInput();

                }

            }
        );

    }

}

// ============================================================
// TASK COMMENTS / FEEDBACK
// ============================================================

let currentCommentTaskId = null;


function renderTaskComments(task) {

    const container = getElement("taskCommentsList");

    if (!container) return;

    const comments = (task && task.comments) || [];

    if (comments.length === 0) {

        container.innerHTML = `<div class="chapter-empty">No comments yet.</div>`;

        return;

    }

    container.innerHTML = comments
        .map(entry => `
            <div class="comment-item ${entry.role === "lecturer" ? "lecturer-comment" : ""}">
                <div>${entry.text}</div>
                <div class="comment-meta">
                    <strong>${entry.role === "lecturer" ? "🎓 " : ""}${entry.author}</strong>
                    <span>${formatActivityTime(entry.time)}</span>
                </div>
            </div>
        `)
        .join("");

}


function addTaskCommentFromInput() {

    const input = getElement("taskCommentInput");

    if (!input || !currentCommentTaskId) return;

    const text = sanitizeText(input.value);

    if (!text) return;

    const task = tasks.find(item => item.id === currentCommentTaskId);

    if (!task) return;

    if (!Array.isArray(task.comments)) {

        task.comments = [];

    }

    const currentUser = getCurrentUser() || "Unknown";

    task.comments.push({

        id: Date.now() + Math.random(),

        text: text,

        author: currentUser,

        role: isLecturer() ? "lecturer" : "member",

        time: new Date().toISOString()

    });

    saveData();

    logActivity(`commented on task "${task.name}"`);

    const recipients = new Set();

    if (task.mainPIC) recipients.add(task.mainPIC);

    (task.assigned || []).forEach(name => recipients.add(name));

    recipients.delete(currentUser);

    if (recipients.size > 0) {

        addNotification({
            text: `<strong>${currentUser}</strong> commented on task "${task.name}"`,
            forUsers: Array.from(recipients),
            relatedType: "task",
            relatedId: task.id
        });

    }

    input.value = "";

    renderTaskComments(task);

}


function setupTaskCommentEvents() {

    const addButton = getElement("taskCommentAddBtn");

    if (addButton) {

        addButton.addEventListener("click", addTaskCommentFromInput);

    }

    const input = getElement("taskCommentInput");

    if (input) {

        input.addEventListener("keydown", event => {

            if (event.key === "Enter") {

                event.preventDefault();

                addTaskCommentFromInput();

            }

        });

    }

}


// ============================================================
// RESOURCE (CHAPTER) COMMENTS / FEEDBACK
// ============================================================

let currentCommentResourceId = null;


function renderResourceComments(resource) {

    const container = getElement("resourceCommentsList");

    if (!container) return;

    const comments = (resource && resource.comments) || [];

    if (comments.length === 0) {

        container.innerHTML = `<div class="chapter-empty">No comments yet.</div>`;

        return;

    }

    container.innerHTML = comments
        .map(entry => `
            <div class="comment-item ${entry.role === "lecturer" ? "lecturer-comment" : ""}">
                <div>${entry.text}</div>
                <div class="comment-meta">
                    <strong>${entry.role === "lecturer" ? "🎓 " : ""}${entry.author}</strong>
                    <span>${formatActivityTime(entry.time)}</span>
                </div>
            </div>
        `)
        .join("");

}


function addResourceCommentFromInput() {

    const input = getElement("resourceCommentInput");

    if (!input || !currentCommentResourceId) return;

    const text = sanitizeText(input.value);

    if (!text) return;

    const resource = resources.find(item => item.id === currentCommentResourceId);

    if (!resource) return;

    if (!Array.isArray(resource.comments)) {

        resource.comments = [];

    }

    const currentUser = getCurrentUser() || "Unknown";

    resource.comments.push({

        id: Date.now() + Math.random(),

        text: text,

        author: currentUser,

        role: isLecturer() ? "lecturer" : "member",

        time: new Date().toISOString()

    });

    saveResourcesData();

    logActivity(`commented on resource "${resource.title}"`);

    const recipients =
        members
            .map(member => member.name)
            .filter(name => name !== currentUser);

    if (recipients.length > 0) {

        addNotification({
            text: `<strong>${currentUser}</strong> commented on "${resource.title}" (${resource.chapter})`,
            forUsers: recipients,
            relatedType: "resource",
            relatedId: resource.id
        });

    }

    input.value = "";

    renderResourceComments(resource);

}


function setupResourceCommentEvents() {

    const addButton = getElement("resourceCommentAddBtn");

    if (addButton) {

        addButton.addEventListener("click", addResourceCommentFromInput);

    }

    const input = getElement("resourceCommentInput");

    if (input) {

        input.addEventListener("keydown", event => {

            if (event.key === "Enter") {

                event.preventDefault();

                addResourceCommentFromInput();

            }

        });

    }

}


function getElement(id) {

    return document.getElementById(id);

}


function getAccountByEmail(email) {

    const normalizedEmail = String(email || "").toLowerCase();

    if (LECTURER.email.toLowerCase() === normalizedEmail) {
        return {
            ...LECTURER,
            role: "lecturer"
        };
    }

    const member = members.find(
        item => item.email.toLowerCase() === normalizedEmail
    );

    return member
        ? { ...member, role: "member" }
        : null;

}


function startFirebaseDataListeners() {

    if (dataListenersStarted) {
        return;
    }

    dataListenersStarted = true;

    listenToTasks();
    listenToMeetings();
    listenToResources();
    listenToActivityLog();
    listenToMemberPhotos();
    listenToNotifications();
    listenToDeleteRequests();
    listenToSystemSettings();
    listenToChapterReviews();
    listenToReminderLog();
    listenToAiInsight();

    if (isGroupLeader()) {

        listenToLeaderNotes();

    }

}


function handleAuthStateChanged(firebaseUser) {

    if (!firebaseUser) stopTeamPresence();

    if (!firebaseUser) {

        localStorage.removeItem("designProjectCurrentUser");
        localStorage.removeItem("designProjectCurrentRole");
        setSyncStatus(false, "Sign in required");

        const loginScreen = getElement("loginScreen");

        if (loginScreen) {
            loginScreen.classList.remove("hidden");
        }

        renderLoginScreen();
        return;

    }

    const account = getAccountByEmail(firebaseUser.email);

    if (!account) {

        showToast("This account is not authorized for the project dashboard.");
        auth.signOut();
        return;

    }

    localStorage.setItem("designProjectCurrentUser", account.name);
    localStorage.setItem("designProjectCurrentRole", account.role);
    setSyncStatus(true, "Synced");
    startFirebaseDataListeners();
    enterApp();
    startTeamPresence(firebaseUser);

}


// ============================================================
// DISPLAY-SAFE TEXT
// ============================================================
// Data is rendered in several HTML templates. Strip characters that
// could otherwise terminate a tag or an attribute before data is saved
// or displayed. This is defence-in-depth, not a replacement for
// Firebase Authentication and server-side security rules.
function sanitizeText(value) {

    return String(value ?? "")
        .replace(/[<>"'`]/g, "")
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .trim();

}


function sanitizeStoredData(value) {

    if (typeof value === "string") {
        return sanitizeText(value);
    }

    if (Array.isArray(value)) {
        return value.map(sanitizeStoredData);
    }

    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [
                key, sanitizeStoredData(item)
            ])
        );
    }

    return value;

}


// ============================================================
// LOCK / UNLOCK MODAL FIELDS (used for lecturer view-only mode)
// ============================================================

function setModalFieldsDisabled(modalId, disabled) {

    const modal = getElement(modalId);

    if (!modal) return;

    modal.querySelectorAll("input, select, textarea").forEach(el => {

        el.disabled = disabled;

    });

}


// ============================================================
// AVATAR HELPER (photo if available, else initial letter)
// ============================================================

function getAvatarHtml(name) {

    const photo = getMemberPhotoUrl(name);

    if (photo) {

        return `<img src="${photo}" alt="${name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><span class="avatar-fallback">${name.charAt(0)}</span>`;

    }

    return name.charAt(0);

}


// ============================================================
// EMAILJS INITIALIZE
// ============================================================

function initEmailJS() {

    if (
        typeof emailjs !== "undefined" &&
        EMAILJS_PUBLIC_KEY !==
        "YOUR_EMAILJS_PUBLIC_KEY"
    ) {

        emailjs.init({
            publicKey:
                EMAILJS_PUBLIC_KEY
        });

    }

}


// ============================================================
// DATE FUNCTIONS
// ============================================================

function getDaysLeft(deadline) {

    if (!deadline) {
        return 9999;
    }

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    const dueDate =
        new Date(
            deadline +
            "T00:00:00"
        );

    return Math.ceil(
        (
            dueDate -
            today
        ) /
        (
            1000 *
            60 *
            60 *
            24
        )
    );

}


// ============================================================
// DEADLINE STATUS
// ============================================================

function getDeadlineStatus(task) {

    if (
        task.status === "Done"
    ) {

        return {
            type: "done",
            text: "DONE"
        };

    }

    if (
        !task.deadline
    ) {

        return {
            type: "none",
            text: "NO DEADLINE"
        };

    }

    const days =
        getDaysLeft(
            task.deadline
        );


    if (
        days < 0
    ) {

        return {
            type: "overdue",
            text: "OVERDUE"
        };

    }


    if (
        days === 0
    ) {

        return {
            type: "urgent",
            text: "DUE TODAY"
        };

    }


    if (
        days <= 3
    ) {

        return {
            type: "warning",
            text:
                `${days} DAY${days === 1 ? "" : "S"} LEFT`
        };

    }


    if (
        days <= 7
    ) {

        return {
            type: "upcoming",
            text:
                `${days} DAYS LEFT`
        };

    }


    return {
        type: "normal",
        text:
            `${days} DAYS LEFT`
    };

}


// ============================================================
// DASHBOARD
// ============================================================

function updateDashboard() {

    const total =
        tasks.length;


    let totalProgress = 0;


    tasks.forEach(
        task => {

            totalProgress +=
                Number(
                    task.progress || 0
                );

        }
    );


    const overall =
        total === 0
            ? 0
            : Math.round(
                totalProgress /
                total
            );


    const overallProgress =
        getElement(
            "overallProgress"
        );


    if (overallProgress) {

        overallProgress.textContent =
            overall + "%";

    }



    const overallBar =
        getElement(
            "overallBar"
        );


    if (overallBar) {

        overallBar.style.width =
            overall + "%";

    }


    const totalTasks =
        getElement(
            "totalTasks"
        );


    if (totalTasks) {

        totalTasks.textContent =
            total;

    }


    const inProgress =
        getElement(
            "inProgress"
        );


    if (inProgress) {

        inProgress.textContent =
            tasks.filter(
                task =>
                    task.status ===
                    "In Progress"
            ).length;

    }


    const overdue =
        getElement(
            "overdue"
        );


    if (overdue) {

        overdue.textContent =
            tasks.filter(
                task =>
                    task.status !== "Done" &&
                    getDaysLeft(
                        task.deadline
                    ) < 0
            ).length;

    }


    updateMemberProgress();

    updateTeamProgress();

    updateStatus();

    updateAttention();

    renderMarkingOverview();

    renderChapterProgress();

}


// ============================================================
// OVERALL TEAM PROGRESS
// ============================================================

function updateTeamProgress() {

    const container =
        getElement(
            "teamProgressList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    members.forEach(
        member => {


            const memberTasks =
                tasks.filter(
                    task =>
                        (
                            task.assigned &&
                            task.assigned.includes(
                                member.name
                            )
                        ) ||
                        task.mainPIC ===
                        member.name
                );


            let progress = 0;


            if (
                memberTasks.length > 0
            ) {

                const total =
                    memberTasks.reduce(
                        (
                            sum,
                            task
                        ) =>
                            sum +
                            Number(
                                task.progress || 0
                            ),
                        0
                    );


                progress =
                    Math.round(
                        total /
                        memberTasks.length
                    );

            }


            container.innerHTML += `

                <div class="team-progress-item">

                    <div class="team-progress-top">

                        <span class="team-progress-name">

                            👤 ${member.name}

                        </span>

                        <span class="team-progress-percent">

                            ${progress}%

                        </span>

                    </div>


                    <div class="team-progress-bar">

                        <div
                            class="team-progress-fill"
                            style="width:${progress}%"
                        ></div>

                    </div>


                    <div class="team-progress-tasks">

                        ${memberTasks.length}
                        task${memberTasks.length === 1 ? "" : "s"}

                    </div>

                </div>

            `;

        }
    );

}


// ============================================================
// MEMBER PROGRESS
// ============================================================

function updateMemberProgress() {

    const container =
        getElement(
            "memberProgress"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    members.forEach(
        member => {


            const memberTasks =
                tasks.filter(
                    task =>
                        (
                            task.assigned &&
                            task.assigned.includes(
                                member.name
                            )
                        ) ||
                        task.mainPIC ===
                        member.name
                );


            let progress = 0;


            if (
                memberTasks.length
            ) {

                const total =
                    memberTasks.reduce(
                        (
                            sum,
                            task
                        ) =>
                            sum +
                            Number(
                                task.progress || 0
                            ),
                        0
                    );


                progress =
                    Math.round(
                        total /
                        memberTasks.length
                    );

            }


            container.innerHTML += `

                <div class="member">

                    <div class="member-info">

                        <span>
                            ${member.name}
                        </span>

                        <strong>
                            ${progress}%
                        </strong>

                    </div>


                    <div class="member-bar">

                        <div
                            style="width:${progress}%"
                        ></div>

                    </div>

                </div>

            `;

        }
    );

}


// ============================================================
// STATUS BREAKDOWN
// ============================================================

function updateStatus() {

    const container =
        getElement(
            "statusBreakdown"
        );


    if (!container) {
        return;
    }


    const statuses = [

        "Done",
        "In Progress",
        "Not Started",
        "Blocked"

    ];


    container.innerHTML = "";


    statuses.forEach(
        status => {


            const count =
                tasks.filter(
                    task =>
                        task.status ===
                        status
                ).length;


            container.innerHTML += `

                <div class="status">

                    <span>
                        ${status}
                    </span>

                    <strong>
                        ${count}
                    </strong>

                </div>

            `;

        }
    );

}


// ============================================================
// ATTENTION / WARNING
// ============================================================

function getAttentionTasks() {

    return tasks
        .filter(task =>
            task.status !== "Done" &&
            task.deadline &&
            getDaysLeft(task.deadline) <= 3
        )
        .sort((a, b) => getDaysLeft(a.deadline) - getDaysLeft(b.deadline));

}


function getAttentionCounts(items) {

    return items.reduce(
        (counts, task) => {

            const days = getDaysLeft(task.deadline);

            if (days < 0) counts.overdue += 1;
            else if (days === 0) counts.today += 1;
            else counts.soon += 1;

            return counts;

        },
        { overdue: 0, today: 0, soon: 0 }
    );

}


function updateAttention() {

    const alert = getElement("attentionAlert");
    const title = getElement("attentionAlertTitle");
    const meta = getElement("attentionAlertMeta");

    if (!alert) return;

    const urgent = getAttentionTasks();

    if (urgent.length === 0) {

        alert.classList.add("hidden");
        renderAttentionModalList([]);
        return;

    }

    const counts = getAttentionCounts(urgent);
    const parts = [];

    if (counts.overdue) parts.push(`${counts.overdue} overdue`);
    if (counts.today) parts.push(`${counts.today} due today`);
    if (counts.soon) parts.push(`${counts.soon} due within 3 days`);

    alert.classList.remove("hidden");

    if (title) {
        title.textContent = `${urgent.length} item${urgent.length === 1 ? "" : "s"} need attention`;
    }

    if (meta) {
        meta.textContent = parts.join(" · ");
    }

    renderAttentionModalList(urgent);

}


function renderAttentionModalList(items = getAttentionTasks()) {

    const container = getElement("attentionModalList");
    const summary = getElement("attentionModalSummary");

    if (!container) return;

    if (!items.length) {

        container.innerHTML = `<div class="attention-modal-empty">🎉 No urgent deadlines right now.</div>`;

        if (summary) summary.textContent = "Nothing requires immediate action";

        return;

    }

    const counts = getAttentionCounts(items);
    const summaryParts = [];

    if (counts.overdue) summaryParts.push(`${counts.overdue} overdue`);
    if (counts.today) summaryParts.push(`${counts.today} due today`);
    if (counts.soon) summaryParts.push(`${counts.soon} due soon`);

    if (summary) summary.textContent = summaryParts.join(" · ");

    container.innerHTML = items.map(task => {

        const deadline = getDeadlineStatus(task);
        const days = getDaysLeft(task.deadline);

        const urgencyClass =
            days < 0 ? "overdue" :
            days === 0 ? "today" :
            "soon";

        const icon =
            days < 0 ? "🔴" :
            days === 0 ? "🚨" :
            "🟠";

        const classification = [
            getTaskChapter(task) !== "Unassigned" ? getTaskChapter(task) : "",
            getTaskWorkPackage(task)
        ].filter(Boolean).join(" · ");

        return `
            <button
                type="button"
                class="attention-modal-item ${urgencyClass}"
                onclick="openAttentionTask(${task.id})"
            >
                <span class="attention-modal-status">${icon}</span>
                <span class="attention-modal-task-copy">
                    <strong>${task.name}</strong>
                    <small>
                        PIC: ${task.mainPIC || "-"}
                        ${classification ? ` · ${classification}` : ""}
                    </small>
                </span>
                <span class="attention-modal-deadline">
                    <strong>${deadline.text}</strong>
                    <small>${task.deadline || ""}</small>
                </span>
                <span class="attention-modal-arrow">›</span>
            </button>
        `;

    }).join("");

}


function openAttentionModal() {

    const modal = getElement("attentionModal");

    if (!modal) return;

    renderAttentionModalList();
    modal.classList.remove("hidden");

}


function closeAttentionModal() {

    const modal = getElement("attentionModal");

    if (modal) modal.classList.add("hidden");

}


function openAttentionTask(taskId) {

    closeAttentionModal();
    showSection("tasks");
    editTask(Number(taskId));

}


function openAttentionTasks() {

    closeAttentionModal();
    showSection("tasks");

    const statusFilter = getElement("filterStatus");
    const priorityFilter = getElement("filterPriority");
    const memberFilter = getElement("filterMember");
    const chapterFilter = getElement("filterChapter");
    const equipmentFilter = getElement("filterEquipment");

    if (statusFilter) statusFilter.value = "All";
    if (priorityFilter) priorityFilter.value = "All";
    if (memberFilter) memberFilter.value = "All";
    if (chapterFilter) chapterFilter.value = "All";

    updateEquipmentFilterOptions();

    if (equipmentFilter) equipmentFilter.value = "All";

    const search = getElement("search");
    if (search) search.value = "";

    renderTasks();

}


function maybeShowCriticalAttentionPopup() {

    const currentUser = getCurrentUser();

    if (!currentUser) return;

    const critical = getAttentionTasks().filter(task => getDaysLeft(task.deadline) <= 0);

    if (!critical.length) return;

    const today = formatDate(new Date());
    const storageKey = `designProjectAttentionSeen_${currentUser}`;

    if (localStorage.getItem(storageKey) === today) return;

    const quoteModal = getElement("dailyQuoteModal");

    if (quoteModal && !quoteModal.classList.contains("hidden")) return;

    const otherOpenModal = document.querySelector(
        ".modal:not(.hidden), .logout-modal:not(.hidden), .pin-modal:not(.hidden)"
    );

    if (otherOpenModal) return;

    openAttentionModal();
    localStorage.setItem(storageKey, today);

}


// ============================================================
// FILTER MEMBERS
// ============================================================

function renderFilterMembers() {

    const select =
        getElement(
            "filterMember"
        );


    if (!select) {
        return;
    }


    const current =
        select.value;


    select.innerHTML = `

        <option value="All">
            All Members
        </option>

    `;


    members.forEach(
        member => {

            select.innerHTML += `

                <option value="${member.name}">

                    ${member.name}

                </option>

            `;

        }
    );


    if (
        members.some(
            member =>
                member.name ===
                current
        )
    ) {

        select.value =
            current;

    }

}


// ============================================================
// RENDER TASKS
// ============================================================

function renderTasks() {
    if (typeof window.refreshTaskDetails === "function") window.refreshTaskDetails();

    const escapeAttachment = value => String(value ?? "").replace(/[&<>"']/g,
        char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    const progressPercent = value => {
        const number = Number(value || 0);
        return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : 0;
    };

    const table =
        getElement(
            "taskTable"
        );


    if (!table) {
        return;
    }


    const searchElement =
        getElement(
            "search"
        );


    const search =
        searchElement
            ? searchElement.value.toLowerCase()
            : "";


    const memberElement =
        getElement(
            "filterMember"
        );


    const member =
        memberElement
            ? memberElement.value
            : "All";


    const statusElement =
        getElement(
            "filterStatus"
        );


    const status =
        statusElement
            ? statusElement.value
            : "All";


    const priorityElement =
        getElement(
            "filterPriority"
        );


    const priority =
        priorityElement
            ? priorityElement.value
            : "All";


    const chapterElement =
        getElement(
            "filterChapter"
        );


    const chapter =
        chapterElement
            ? chapterElement.value
            : "All";


    const equipmentElement =
        getElement(
            "filterEquipment"
        );


    const equipment =
        equipmentElement
            ? equipmentElement.value
            : "All";


    const showApprovedToggle =
        getElement(
            "showApprovedToggle"
        );


    const showApproved =
        showApprovedToggle
            ? showApprovedToggle.checked
            : false;


    const filtered =
        tasks.filter(
            task => {


                const taskName =
                    String(
                        task.name || ""
                    ).toLowerCase();


                const searchMatch =
                    taskName.includes(
                        search
                    );


                const assigned =
                    task.assigned || [];


                const memberMatch =
                    member === "All" ||
                    task.mainPIC === member ||
                    assigned.includes(
                        member
                    );


                const statusMatch =
                    status === "All" ||
                    task.status === status;


                const priorityMatch =
                    priority === "All" ||
                    task.priority === priority;


                const taskChapter = getTaskChapter(task);
                const taskEquipment = getTaskWorkPackage(task);

                const chapterMatch =
                    chapter === "All" ||
                    taskChapter === chapter;

                const equipmentMatch =
                    equipment === "All" ||
                    (
                        equipment === GENERAL_CHAPTER_PACKAGE_KEY
                            ? !taskEquipment
                            : taskEquipment === equipment
                    );


                const taskMarkingStatus =
                    (task.lecturerMarking && task.lecturerMarking.status) || "not_reviewed";

                const markingMatch =
                    filterLecturerStatusValue === "All" ||
                    taskMarkingStatus === filterLecturerStatusValue;


                // Approved tasks are hidden from the main list by default
                // (toggle-able), UNLESS the lecturer explicitly clicked the
                // "Approved" card in Marking Overview to look for them.
                const approvedMatch =
                    showApproved ||
                    filterLecturerStatusValue === "approved" ||
                    taskMarkingStatus !== "approved";


                return (
                    searchMatch &&
                    memberMatch &&
                    statusMatch &&
                    priorityMatch &&
                    chapterMatch &&
                    equipmentMatch &&
                    markingMatch &&
                    approvedMatch
                );

            }
        );


    table.innerHTML = "";


    const resultInfo =
        getElement(
            "filterResultInfo"
        );


    if (resultInfo) {

        resultInfo.textContent =
            `${filtered.length} task(s) found`;

    }


    filtered.forEach(
        task => {


            let statusClass =
                "not-started";


            if (
                task.status ===
                "Done"
            ) {

                statusClass =
                    "done";

            }


            if (
                task.status ===
                "In Progress"
            ) {

                statusClass =
                    "progress-status";

            }


            if (
                task.status ===
                "Blocked"
            ) {

                statusClass =
                    "blocked";

            }


            const deadline =
                getDeadlineStatus(
                    task
                );


            let deadlineClass =
                "deadline-normal";


            if (
                deadline.type ===
                "overdue"
            ) {

                deadlineClass =
                    "deadline-overdue";

            }

            else if (
                deadline.type ===
                "urgent"
            ) {

                deadlineClass =
                    "deadline-urgent";

            }

            else if (
                deadline.type ===
                "warning"
            ) {

                deadlineClass =
                    "deadline-warning";

            }

            else if (
                deadline.type ===
                "upcoming"
            ) {

                deadlineClass =
                    "deadline-upcoming";

            }

            else if (
                deadline.type ===
                "none"
            ) {

                deadlineClass =
                    "deadline-none";

            }


            let attachment =
                "-";


            if (
                task.attachment
            ) {

                attachment = `

                    <a
                        class="open-link"
                        href="${task.attachment}"
                        target="_blank"
                        rel="noopener"
                    >

                        🔗 Open Link

                    </a>

                `;

            }


            if (
                task.fileName
            ) {

                attachment +=
                    task.fileUrl
                        ? `
                            <br>
                            <a
                                class="open-link task-file-chip"
                                title="${escapeAttachment(task.fileName)}"
                                aria-label="Open ${escapeAttachment(task.fileName)}"
                                href="${escapeAttachment(task.fileUrl)}"
                                target="_blank"
                                rel="noopener"
                            >
                                <span aria-hidden="true">📄</span>
                                <span class="task-file-chip__name">${escapeAttachment(task.fileName)}</span>
                            </a>
                        `
                        : `
                            <br>
                            <small>
                                📄 ${escapeAttachment(task.fileName)} (no file uploaded)
                            </small>
                        `;

            }


            if (
                Array.isArray(task.links) &&
                task.links.length > 0
            ) {

                attachment +=
                    task.links
                        .map(
                            link => `
                                <br>
                                <a
                                    class="open-link"
                                    href="${link.url}"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    🔗 ${link.label || "Link"}
                                </a>
                            `
                        )
                        .join("");

            }


            const assigned =
                task.assigned || [];


            const subtaskStats =
                getSubtaskStats(
                    task
                );


            table.innerHTML += `

                <tr>

                    <td data-label="Task">

                        <button type="button" class="task-detail-trigger" onclick="openTaskDetails(${Number(task.id)})" aria-haspopup="dialog">
                            ${escapeAttachment(task.name)}
                        </button>

                        ${window.taskUpdateLabel(task) ? '<small class="task-updated-label" title="'+escapeAttachment(new Date(task.updatedAt).toLocaleString())+'">'+escapeAttachment(window.taskUpdateLabel(task))+'</small>' : ''}
                        ${getLecturerMarkingBadge(task)}

                        <div class="task-classification-tags">
                            <span class="task-classification-tag">📚 ${getTaskChapter(task)}</span>
                            ${getTaskWorkPackage(task)
                                ? `<span class="task-classification-tag equipment">⚙️ ${getTaskWorkPackage(task)}</span>`
                                : ""}
                        </div>

                        ${
                            subtaskStats.total > 0
                                ? `
                                    <div class="subtask-mini-progress">
                                        ☑️ ${subtaskStats.done}/${subtaskStats.total} checklist
                                    </div>
                                `
                                : ""
                        }

                    </td>


                    <td data-label="Main PIC">

                        <span class="pic-tag">

                            ${task.mainPIC || "-"}

                        </span>

                    </td>


                    <td data-label="Assigned To">

                        <div class="pic-list">

                            ${
                                assigned.length
                                    ? assigned
                                        .map(
                                            person =>
                                                `
                                                <span class="pic-tag">
                                                    ${person}
                                                </span>
                                                `
                                        )
                                        .join("")
                                    : "-"
                            }

                        </div>

                    </td>


                    <td data-label="Priority">
                        ${task.priority || "-"}
                    </td>


                    <td data-label="Status">

                        <span
                            class="
                                badge
                                ${statusClass}
                            "
                        >

                            ${task.status}

                        </span>

                    </td>


                    <td data-label="Progress">

                        <span class="task-progress">
                            <progress max="100" value="${progressPercent(task.progress)}"
                                aria-label="Task progress">${progressPercent(task.progress)}%</progress>
                            <span class="task-progress__value">${progressPercent(task.progress)}%</span>
                        </span>

                    </td>


                    <td data-label="Deadline">

                        <span
                            class="
                                deadline-badge
                                ${deadlineClass}
                            "
                        >

                            ${deadline.text}

                        </span>


                        <small class="date-text">

                            ${task.deadline || "-"}

                        </small>

                    </td>


                    <td data-label="Attachment">

                        ${attachment === "-" ? attachment : attachment.replace(/^-/, "")}

                    </td>


                    <td data-label="Action">
                        <div class="task-row-actions">
                        ${
                            isLecturer()
                                ? getLecturerMarkingActionButton(task)
                                : `
                                    <button
                                        class="edit-btn"
                                        onclick="editTask(${task.id})"
                                    >
                                        Edit
                                    </button>

                                    <details class="task-more-actions"
                                        onkeydown="if(event.key==='Escape'){this.open=false;this.querySelector('summary').focus();}">
                                        <summary aria-label="More task actions" title="More actions">⋯</summary>
                                        <div class="task-more-actions__menu">
                                            <button type="button" class="delete-btn"
                                                onclick="this.closest('details').open=false;deleteTask(${task.id})">
                                                Delete task
                                            </button>
                                        </div>
                                    </details>
                                `
                        }

                        </div>
                    </td>

                </tr>

            `;

        }
    );


    if (
        filtered.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td colspan="9" style="padding:0;border:none;">

                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-title">${tasks.length === 0 ? "No tasks yet" : "No tasks match your filters"}</div>
                        <div class="empty-state-text">
                            ${tasks.length === 0
                                ? "Add your first task to start tracking progress."
                                : "Try adjusting your search or filters."}
                        </div>
                        ${tasks.length === 0 && !isLecturer() ? `<button class="small-add" onclick="openTaskModal()">+ Add Task</button>` : ""}
                    </div>

                </td>

            </tr>

        `;

    }

}


// ============================================================
// TEAM CARDS
// ============================================================

function renderTeam() {

    const container =
        getElement(
            "teamList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    members.forEach(
        member => {


            const memberTasks =
                tasks.filter(
                    task =>
                        task.mainPIC ===
                        member.name ||
                        (
                            task.assigned &&
                            task.assigned.includes(
                                member.name
                            )
                        )
                );


            let progress = 0;


            if (
                memberTasks.length
            ) {

                progress =
                    Math.round(
                        memberTasks.reduce(
                            (
                                total,
                                task
                            ) =>
                                total +
                                Number(
                                    task.progress || 0
                                ),
                            0
                        ) /
                        memberTasks.length
                    );

            }


            container.innerHTML += `

                <article class="team-card">
                    <div class="team-member-heading">
                        <div class="avatar">${getAvatarHtml(member.name)}</div>
                        <div class="team-member-identity">
                            <h3>${member.name}</h3>
                            <p class="team-member-role ${member.name === LEADER_NAME ? 'is-leader' : ''}">${member.name === LEADER_NAME ? 'Group Leader' : 'Team Member'}</p>
                        </div>
                    </div>
                    <div class="team-member-progress">
                        <div class="team-progress-meta">
                            <span>${memberTasks.length} ${memberTasks.length === 1 ? 'task' : 'tasks'} assigned</span>
                            <strong>${progress}%</strong>
                        </div>
                        <progress max="100" value="${progress}" aria-label="${member.name} task progress">${progress}%</progress>
                        <p>Overall task progress</p>
                    </div>
                    <div class="team-member-actions">
                        <button type="button" onclick="openMemberProfile('${member.name}')">View Profile <span aria-hidden="true">↗</span></button>
                        ${isGroupLeader() ? `<button type="button" class="team-report-btn" onclick="generateContributionReport('${member.name}')">Report</button>` : ''}
                    </div>
                    ${getCurrentUser() === member.name ? `
                        <label class="change-photo-btn">
                            Change photo
                            <input type="file" accept="image/*" onchange="changeMyPhoto(event)">
                        </label>
                    ` : ''}
                </article>
            `;
        }
    );

    renderTeamPresence();

}


// ============================================================
// MAIN PIC DROPDOWN
// ============================================================

function populateMainPIC(
    selected = ""
) {

    const select =
        getElement(
            "mainPIC"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `

        <option value="">
            Select Main PIC
        </option>

    `;


    members.forEach(
        member => {

            select.innerHTML += `

                <option
                    value="${member.name}"
                    ${
                        selected ===
                        member.name
                            ? "selected"
                            : ""
                    }
                >

                    ${member.name}

                </option>

            `;

        }
    );

}


// ============================================================
// ASSIGNED MEMBERS CHECKBOX
// ============================================================

function renderMemberCheckboxes(
    selected = []
) {

    const container =
        getElement(
            "memberCheckboxes"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    members.forEach(
        member => {


            const checked =
                selected.includes(
                    member.name
                );


            container.innerHTML += `

                <label
                    class="member-option"
                    style="
                        display:flex;
                        gap:8px;
                        align-items:center;
                        margin:8px 0;
                    "
                >

                    <input
                        type="checkbox"
                        name="assignedMember"
                        value="${member.name}"
                        ${
                            checked
                                ? "checked"
                                : ""
                        }
                    >

                    <span>

                        ${member.name}

                    </span>

                </label>

            `;

        }
    );

}


// ============================================================
// LECTURER TASK CARD (read-only summary shown at the top of the
// Edit Task modal for the lecturer role — task name, PIC,
// progress, deadline, assigned members and attachments/links,
// all visible without expanding anything, so the lecturer can
// see the evidence before marking.)
// ============================================================

function renderLecturerTaskCard(task) {

    const card = getElement("lecturerTaskCard");

    if (!card) return;

    if (!isLecturer() || !task) {

        card.classList.add("hidden");

        return;

    }

    card.classList.remove("hidden");

    const deadline = getDeadlineStatus(task);

    let deadlineClass = "deadline-normal";

    if (deadline.type === "overdue") deadlineClass = "deadline-overdue";

    else if (deadline.type === "urgent") deadlineClass = "deadline-urgent";

    else if (deadline.type === "warning") deadlineClass = "deadline-warning";

    else if (deadline.type === "upcoming") deadlineClass = "deadline-upcoming";

    else if (deadline.type === "none") deadlineClass = "deadline-none";

    const assigned = task.assigned || [];

    const assignedHtml =
        assigned.length
            ? assigned.map(name => `<span class="pic-tag">${name}</span>`).join("")
            : "-";

    const evidenceCards = [];

    if (task.attachment) {

        evidenceCards.push(`
            <a class="evidence-card" href="${task.attachment}" target="_blank" rel="noopener">
                <span class="evidence-card-icon">🔗</span>
                <span class="evidence-card-label">Open Link</span>
            </a>
        `);

    }

    if (task.fileName) {

        evidenceCards.push(
            task.fileUrl
                ? `
                    <a class="evidence-card" href="${task.fileUrl}" target="_blank" rel="noopener">
                        <span class="evidence-card-icon">📄</span>
                        <span class="evidence-card-label">${task.fileName}</span>
                    </a>
                `
                : `
                    <div class="evidence-card evidence-card-missing">
                        <span class="evidence-card-icon">📄</span>
                        <span class="evidence-card-label">${task.fileName}</span>
                        <span class="evidence-card-warn">not uploaded</span>
                    </div>
                `
        );

    }

    if (Array.isArray(task.links) && task.links.length > 0) {

        task.links.forEach(link => {

            evidenceCards.push(`
                <a class="evidence-card" href="${link.url}" target="_blank" rel="noopener">
                    <span class="evidence-card-icon">🔗</span>
                    <span class="evidence-card-label">${link.label || "Link"}</span>
                </a>
            `);

        });

    }

    const attachmentsHtml =
        evidenceCards.length > 0
            ? `<div class="evidence-card-grid">${evidenceCards.join("")}</div>`
            : `
                <div class="evidence-empty-card">
                    <span class="evidence-empty-icon">⚠️</span>
                    <span>No attachment or link provided</span>
                </div>
            `;

    card.innerHTML = `

        <div class="lecturer-card-header">

            <div class="lecturer-card-title">${task.name}</div>

            <span class="lecturer-card-pic">👤 ${task.mainPIC || "-"}</span>

        </div>

        <div class="lecturer-card-meta">

            <span class="deadline-badge ${deadlineClass}">${deadline.text}</span>

            ${task.deadline ? `<span class="lecturer-card-date">📅 ${task.deadline}</span>` : ""}

        </div>

        <div class="lecturer-card-progress-wrap">

            <span class="lecturer-card-progress-text">${task.progress || 0}%</span>

            <div class="lecturer-card-progress-bar">
                <div style="width:${task.progress || 0}%"></div>
            </div>

        </div>

        <div class="lecturer-card-divider"></div>

        <div class="lecturer-card-row">

            <span class="lecturer-card-label">👥 Assigned to</span>

            <div class="pic-list">${assignedHtml}</div>

        </div>

        <div class="lecturer-card-row">

            <span class="lecturer-card-label">📎 Evidence</span>

            <div class="lecturer-card-attachments-list">${attachmentsHtml}</div>

        </div>

    `;

}


// ============================================================
// LECTURER CHECKLIST COLLAPSE
// ============================================================
//
// For the lecturer role, the checklist is reference-only and not
// central to marking a task, so it stays collapsed by default and
// is hidden entirely when there's nothing to show. Everyone else
// sees the checklist expanded as usual.
// ============================================================

function setupLecturerChecklistVisibility() {

    const block = getElement("checklistFieldBlock");

    const toggleBtn = getElement("lecturerChecklistToggleBtn");

    const list = getElement("subtaskList");

    const progressLabel = getElement("subtaskProgressLabel");

    if (!block) return;

    if (!isLecturer()) {

        block.classList.remove("hidden");

        if (toggleBtn) toggleBtn.classList.add("hidden");

        if (list) list.classList.remove("hidden");

        if (progressLabel) progressLabel.classList.remove("hidden");

        return;

    }

    if (currentSubtasks.length === 0) {

        block.classList.add("hidden");

        return;

    }

    block.classList.remove("hidden");

    if (toggleBtn) {

        toggleBtn.classList.remove("hidden");

        toggleBtn.textContent = `▸ Show checklist (${currentSubtasks.length})`;

    }

    if (list) list.classList.add("hidden");

    if (progressLabel) progressLabel.classList.add("hidden");

}


function toggleLecturerChecklist() {

    const list = getElement("subtaskList");

    const progressLabel = getElement("subtaskProgressLabel");

    const toggleBtn = getElement("lecturerChecklistToggleBtn");

    if (!list) return;

    const isHidden = list.classList.contains("hidden");

    list.classList.toggle("hidden");

    if (progressLabel) progressLabel.classList.toggle("hidden");

    if (toggleBtn) {

        toggleBtn.textContent =
            isHidden
                ? "▾ Hide checklist"
                : `▸ Show checklist (${currentSubtasks.length})`;

    }

}


// ============================================================
// OPEN TASK MODAL
// ============================================================

// Attachment changes are staged until the task form is saved.
let taskFileRemoved = false;
let taskFileOriginal = null;

function renderTaskFileDraft() {
    const input = getElement("taskFile");
    const label = getElement("currentFile");
    if (!input || !label) return;
    let controls = getElement("taskFileControls");
    if (!controls) {
        controls = document.createElement("span");
        controls.id = "taskFileControls";
        controls.setAttribute("role", "group");
        controls.setAttribute("aria-label", "Attachment actions");
        label.after(controls);
    }
    let card = getElement("taskFileCard");
    if (!card) {
        card = document.createElement("span");
        card.id = "taskFileCard";
        label.before(card);
        card.append(label, controls);
    }
    label.replaceChildren();
    const original = taskFileOriginal;
    const selected = input.files && input.files[0];
    const hasOriginal = !!(original && (original.fileName || original.fileUrl));
    const hasDraft = !!(hasOriginal || selected || taskFileRemoved);
    input.hidden = hasDraft;
    card.hidden = !hasDraft;
    card.className = "attachment-card" + (taskFileRemoved ? " attachment-card--removed" : "");
    if (hasDraft) {
        const name = selected ? selected.name : original.fileName || "Attached file";
        const extension = name.includes(".") ? name.split(".").pop().toUpperCase() : "FILE";
        const icon = document.createElement("span");
        icon.className = "attachment-card__icon";
        icon.textContent = ["DOC", "DOCX"].includes(extension) ? "DOC" : extension.slice(0, 5);
        icon.setAttribute("aria-hidden", "true");
        const details = document.createElement("span");
        details.className = "attachment-card__details";
        const title = document.createElement(selected || taskFileRemoved ? "span" : "a");
        title.className = "attachment-card__name";
        title.textContent = name;
        const url = original && original.fileUrl || "";
        if (!selected && !taskFileRemoved && (url.startsWith("https://") || url.startsWith("http://"))) {
            title.href = url;
            title.target = "_blank";
            title.rel = "noopener";
        }
        const status = document.createElement("span");
        status.className = "attachment-card__status";
        status.setAttribute("role", "status");
        if (taskFileRemoved) {
            status.textContent = "Will be removed when you save.";
        } else if (selected) {
            const size = selected.size < 1048576
                ? Math.max(1, Math.round(selected.size / 1024)) + " KB"
                : (selected.size / 1048576).toFixed(1) + " MB";
            status.textContent = size + " · " + (hasOriginal
                ? "Replaces " + (original.fileName || "current file") + " when saved"
                : "Ready to upload when saved");
        } else {
            status.textContent = url ? "Current attachment" : "File unavailable · please replace";
        }
        details.append(title, status);
        label.append(icon, details);
    }
    controls.replaceChildren();
    if (isLecturer()) return;
    function button(text, action) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "attachment-action attachment-action--" +
            (text === "Remove file" ? "remove" : text === "Replace file" ? "replace" : "undo");
        button.textContent = text;
        button.onclick = event => {
            event.preventDefault();
            if (!isLecturer()) action();
        };
        controls.append(button);
    }
    if (hasOriginal || selected || taskFileRemoved) {
        button("Replace file", () => input.click());
    }
    if ((hasOriginal || selected) && !taskFileRemoved) {
        button("Remove file", () => {
            input.value = "";
            taskFileRemoved = hasOriginal;
            renderTaskFileDraft();
        });
    }
    if (taskFileRemoved || selected) {
        button("Undo", () => {
            input.value = "";
            taskFileRemoved = false;
            renderTaskFileDraft();
        });
    }
}

function openTaskModal(
    task = null,
    prefill = null
) {

    const modal =
        getElement(
            "taskModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "hidden"
    );


    if (
        task
    ) {

        getElement(
            "modalTitle"
        ).textContent =
            "Edit Task";


        getElement(
            "taskId"
        ).value =
            task.id;


        getElement(
            "taskName"
        ).value =
            task.name || "";


        const taskChapterField = getElement("taskChapter");
        const taskWorkPackageField = getElement("taskWorkPackage");

        if (taskChapterField) taskChapterField.value = getTaskChapter(task);
        if (taskWorkPackageField) taskWorkPackageField.value = getTaskWorkPackage(task);


        populateMainPIC(
            task.mainPIC || ""
        );


        renderMemberCheckboxes(
            task.assigned || []
        );


        getElement(
            "taskPriority"
        ).value =
            task.priority || "Medium";


        getElement(
            "taskStatus"
        ).value =
            task.status || "Not Started";


        getElement(
            "taskProgress"
        ).value =
            task.progress || 0;


        getElement(
            "taskDeadline"
        ).value =
            task.deadline || "";


        const attachment =
            getElement(
                "taskAttachment"
            );


        if (attachment) {

            attachment.value =
                task.attachment || "";

        }


        currentSubtasks =
            (
                task.subtasks || []
            ).map(
                item => (
                    {
                        ...item
                    }
                )
            );

        renderSubtaskList();

        setupLecturerChecklistVisibility();

        renderLecturerTaskCard(task);


        currentLinks =
            (
                task.links || []
            ).map(
                item => (
                    {
                        ...item
                    }
                )
            );

        renderLinksList();


        currentCommentTaskId = task.id;

        const taskCommentsSection = getElement("taskCommentsSection");

        if (taskCommentsSection) {

            taskCommentsSection.classList.remove("hidden");

        }

        renderTaskComments(task);

        renderTaskMarkingSection(task);


        syncProgressWithStatus();

    }

    else {

        currentCommentTaskId = null;

        const taskCommentsSectionNew = getElement("taskCommentsSection");

        if (taskCommentsSectionNew) {

            taskCommentsSectionNew.classList.add("hidden");

        }

        getElement(
            "modalTitle"
        ).textContent =
            "Add Task";


        getElement(
            "taskId"
        ).value =
            "";


        getElement(
            "taskName"
        ).value =
            (prefill && prefill.name) || "";


        const taskChapterField = getElement("taskChapter");
        const taskWorkPackageField = getElement("taskWorkPackage");

        if (taskChapterField) {
            const prefillChapter = prefill && prefill.chapter ? prefill.chapter : "Unassigned";
            taskChapterField.value = TASK_CHAPTER_OPTIONS.includes(prefillChapter)
                ? prefillChapter
                : "Unassigned";
        }

        if (taskWorkPackageField) {
            taskWorkPackageField.value = prefill && prefill.workPackage
                ? sanitizeText(prefill.workPackage)
                : "";
        }


        populateMainPIC(
            (prefill && prefill.mainPIC) || getCurrentUser() || ""
        );


        renderMemberCheckboxes(
            (prefill && prefill.assigned) || []
        );


        getElement(
            "taskPriority"
        ).value =
            "Medium";


        getElement(
            "taskStatus"
        ).value =
            "Not Started";


        getElement(
            "taskProgress"
        ).value =
            0;


        getElement(
            "taskDeadline"
        ).value =
            "";


        const attachment =
            getElement(
                "taskAttachment"
            );


        if (attachment) {

            attachment.value = "";

        }


        const file =
            getElement(
                "taskFile"
            );


        if (file) {

            file.value = "";

        }


        const currentFile =
            getElement(
                "currentFile"
            );


        if (currentFile) {

            currentFile.textContent = "";

        }


        currentSubtasks = [];

        renderSubtaskList();

        setupLecturerChecklistVisibility();

        renderLecturerTaskCard(null);


        currentLinks = [];

        renderLinksList();


        syncProgressWithStatus();

    }

    const taskProgressWrap = getElement("taskUploadProgressWrap");

    if (taskProgressWrap) {

        taskProgressWrap.classList.add("hidden");

    }

    taskFileOriginal = task ? { fileName: task.fileName, fileUrl: task.fileUrl } : null;
    taskFileRemoved = false;
    const draftFileInput = getElement("taskFile");
    if (draftFileInput) {
        draftFileInput.value = "";
        draftFileInput.onchange = () => {
            if (draftFileInput.files.length) taskFileRemoved = false;
            renderTaskFileDraft();
        };
    }
    renderTaskFileDraft();

    setModalFieldsDisabled("taskModal", isLecturer());

    const taskCommentInputField = getElement("taskCommentInput");

    if (taskCommentInputField) {

        taskCommentInputField.disabled = false;

    }

    const taskMarkingStatusField = getElement("taskMarkingStatus");

    const taskMarkingRemarksField = getElement("taskMarkingRemarks");

    if (taskMarkingStatusField) {

        taskMarkingStatusField.disabled = !isLecturer();

    }

    if (taskMarkingRemarksField) {

        taskMarkingRemarksField.disabled = !isLecturer();

    }

    reorderTaskModalForRole();

    const lecturerNotice = getElement("lecturerModalNotice");

    if (lecturerNotice) {

        lecturerNotice.classList.toggle("hidden", !isLecturer());

    }

    const taskModalBox = modal.querySelector(".modal-box");

    if (taskModalBox) {

        taskModalBox.scrollTop = 0;

    }

}


// ============================================================
// REORDER TASK MODAL FOR LECTURER
// ============================================================
//
// Lecturer's job in this modal is just to review + set the
// marking status/remarks. Everything else is greyed-out and
// buried below several fields, which made lecturers think the
// whole modal was unusable. So for the lecturer role, the
// Lecturer Marking section is physically moved to the very top
// of the form (right after the hidden taskId field) so it's the
// first thing they see and interact with. For everyone else it
// stays in its normal spot, just above Comments.
// ============================================================

function reorderTaskModalForRole() {

    const form = document.querySelector("#taskModal form");

    const markingSection = getElement("taskMarkingSection");

    const commentsSection = getElement("taskCommentsSection");

    if (!form || !markingSection) return;

    if (isLecturer()) {

        const taskIdField = getElement("taskId");

        const insertAfter = taskIdField ? taskIdField.nextSibling : form.firstChild;

        form.insertBefore(markingSection, insertAfter);

    }

    else if (commentsSection) {

        form.insertBefore(markingSection, commentsSection);

    }

}


// ============================================================
// CLOSE TASK MODAL
// ============================================================

function closeTaskModal() {
    if (taskFormSaving) return;

    const modal =
        getElement(
            "taskModal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

    pendingMomConversion = null;

}


// ============================================================
// SAVE TASK
// ============================================================

let taskFormSaving = false;
async function saveTask(event) {

    event.preventDefault();
    if (taskFormSaving) return;
    taskFormSaving = true;
    const form = event.target;
    const submitButtons = Array.from(form.querySelectorAll('button[type="submit"], input[type="submit"]'));
    submitButtons.forEach(button => button.disabled = true);
    try {

    if (isLecturer()) {

        showToast("View-only access — lecturers cannot edit tasks.");

        closeTaskModal();

        return;

    }


    const id =
        getElement(
            "taskId"
        ).value;


    const mainPIC =
        getElement(
            "mainPIC"
        ).value;


    const assigned =
        Array.from(
            document.querySelectorAll(
                'input[name="assignedMember"]:checked'
            )
        ).map(
            checkbox =>
                checkbox.value
        );


    if (
        !mainPIC
    ) {

        showToast(
            "Please select a Main PIC."
        );

        return;

    }


    if (
        assigned.length === 0
    ) {

        showToast(
            "Please select at least one Assigned Member."
        );

        return;

    }


    const fileInput =
        getElement(
            "taskFile"
        );


    const oldTask =
        id
            ? tasks.find(
                task =>
                    task.id == id
            )
            : null;


    let fileName =
        oldTask
            ? oldTask.fileName || ""
            : "";


    let fileUrl =
        oldTask
            ? oldTask.fileUrl || ""
            : "";


    if (taskFileRemoved) {
        fileName = "";
        fileUrl = "";
    }

    const hasNewTaskFile =
        fileInput &&
        fileInput.files.length > 0;


    if (
        hasNewTaskFile
    ) {

        if (!storage) {

            showToast(
                "File upload isn't set up yet (Firebase Storage not configured). Please use the Attachment Link field instead, or ask the project owner to set up Storage."
            );

            return;

        }

        const file =
            fileInput.files[0];

        fileName =
            file.name;

        try {

            fileUrl =
                await uploadTaskFile(file);

        }

        catch (error) {

            console.error(
                "Task file upload failed:",
                error
            );

            showToast(
                "❌ File upload failed: " +
                error.message
            );

            return;

        }

    }


    const taskData = {

        name:
            sanitizeText(
                getElement(
                    "taskName"
                ).value
            ),


        mainPIC:
            mainPIC,


        assigned:
            assigned,


        chapter:
            getElement("taskChapter")
                ? getElement("taskChapter").value
                : "Unassigned",


        workPackage:
            getElement("taskWorkPackage")
                ? sanitizeText(getElement("taskWorkPackage").value)
                : "",


        priority:
            getElement(
                "taskPriority"
            ).value,


        status:
            getElement(
                "taskStatus"
            ).value,


        progress:
            Number(
                getElement(
                    "taskProgress"
                ).value
            ),


        deadline:
            getElement(
                "taskDeadline"
            ).value,


        attachment:
            getElement(
                "taskAttachment"
            )
                ? sanitizeText(
                    getElement(
                        "taskAttachment"
                    ).value
                )
                : "",


        fileName:
            fileName,


        fileUrl:
            fileUrl,


        subtasks:
            currentSubtasks,


        links:
            currentLinks,


        reviewStatus:
            oldTask
                ? (oldTask.reviewStatus || "none")
                : "none"

    };


    if (
        !taskData.name
    ) {

        showToast(
            "Please enter Task Name."
        );

        return;

    }


    if (
        taskData.status ===
        "Done"
    ) {

        taskData.progress =
            100;

    }


    if (
        taskData.status ===
        "Not Started"
    ) {

        taskData.progress =
            0;

    }


    if (
        taskData.progress < 0
    ) {

        taskData.progress = 0;

    }


    if (
        taskData.progress > 100
    ) {

        taskData.progress = 100;

    }


    if (
        id
    ) {

        const index =
            tasks.findIndex(
                task =>
                    task.id == id
            );


        if (index === -1) {
            showToast("This task is no longer available. Reopen it before saving.");
            return;
        }
        if (
            index !== -1
        ) {

            tasks[index] = {

                ...oldTask,

                id:
                    Number(id),

                ...taskData

            };

        }

    }

    else {

        const newTaskId = Date.now();
        getElement("taskId").value = newTaskId;

        tasks.push({

            id:
                newTaskId,

            ...taskData

        });


        if (pendingMomConversion) {

            linkMomConversionToTask(newTaskId, taskData.name);

        }

    }


    if (hasNewTaskFile) fileInput.value = "";
    const saved = await saveData();
    if (!saved) {
        // Keep the draft open; Retry in the save notice resubmits the captured change.
        return;
    }

    updateEquipmentFilterOptions();

    logActivity(
        (id ? "updated task " : "created task ") +
        `"${taskData.name}"`
    );


    updateDashboard();

    renderTasks();

    renderTeam();

    renderCalendar();

    renderKanban();


    taskFormSaving = false;
    closeTaskModal();


    showToast(
        "Task saved successfully!"
    );

    } finally {
        taskFormSaving = false;
        submitButtons.forEach(button => button.disabled = false);
    }
}


// ============================================================
// EDIT TASK
// ============================================================

function editTask(id) {

    const task =
        tasks.find(
            task =>
                task.id ===
                id
        );


    if (
        task
    ) {

        openTaskModal(
            task
        );

    }

}


// ============================================================
// DELETE TASK
// ============================================================

let pendingDeleteTaskId = null;


function deleteTask(id) {

    if (isLecturer()) {

        showToast("View-only access — lecturers cannot delete tasks.");

        return;

    }

    const task = tasks.find(task => task.id === id);

    if (!task) {
        return;
    }

    if (!isGroupLeader()) {

        requestDelete("task", id, task.name || "Untitled task");

        return;

    }

    const modal = getElement("deleteTaskModal");
    const taskName = getElement("deleteTaskName");

    pendingDeleteTaskId = id;

    if (taskName) {
        taskName.textContent = task.name || "Untitled task";
    }

    if (modal) {
        modal.classList.remove("hidden");
        return;
    }

    confirmDeleteTask();

}


function closeDeleteTaskModal() {

    const modal = getElement("deleteTaskModal");

    if (modal) {
        modal.classList.add("hidden");
    }

    pendingDeleteTaskId = null;

}


function performDeleteTaskById(id) {

    const deletedTask =
        tasks.find(
            task =>
                task.id === id
        );


    tasks =
        tasks.filter(
            task =>
                task.id !==
                id
        );


    saveData();

    logActivity(
        `deleted task "${deletedTask ? deletedTask.name : ""}"`
    );


    updateDashboard();

    renderTasks();

    renderTeam();

    renderCalendar();

    renderKanban();

    return deletedTask;

}


function confirmDeleteTask() {

    const id = pendingDeleteTaskId;

    if (id === null) {
        return;
    }

    closeDeleteTaskModal();

    performDeleteTaskById(id);

}


// ============================================================
// NAVIGATION
// ============================================================

function showSection(
    name
) {

    closeMobileSidebar();

    if (name === "gantt" && !hasPersistentLeaderSession()) {
        showSection("dashboard");
        return;
    }
    if (name === "gantt" && window.dpGantt) window.dpGantt.open();

    document
        .querySelectorAll(
            ".section"
        )
        .forEach(
            section =>
                section.classList.add(
                    "hidden"
                )
        );


    const section =
        getElement(
            name
        );


    if (
        section
    ) {

        section.classList.remove(
            "hidden"
        );

    }


    if (
        name === "calendar"
    ) {

        renderCalendar();

    }


    if (
        name === "meetings"
    ) {

        renderMeetings();

    }


    if (
        name === "resources"
    ) {

        renderChapters();

    }


    if (
        name === "engineering"
    ) {

        renderEngineeringToolAccess();

    }


    if (
        name === "activity"
    ) {

        renderActivityLog();

    }


    if (
        name === "myday"
    ) {

        renderMyDay();

    }


    if (
        name === "tasks"
    ) {

        renderKanban();

    }


    if (
        name === "leaderhub"
    ) {

        if (!isGroupLeader()) {

            showToast(`Only ${LEADER_NAME} can access the Leader Hub.`);

            showSection("dashboard");

            return;

        }

        renderLeaderHub();

    }


    if (
        name === "admin"
    ) {

        if (!isGroupLeader()) {

            showToast(`Only ${LEADER_NAME} can access system settings.`);

            showSection("dashboard");

            return;

        }

        populateAdminForm();

    }

}


// ============================================================
// PROFILE
// ============================================================

function openMemberProfile(
    memberName
) {

    const member =
        members.find(
            person =>
                person.name ===
                memberName
        );


    if (!member) {
        return;
    }


    showMemberProfile(
        member
    );

}


// ============================================================
// SHOW MEMBER PROFILE
// ============================================================

let currentProfileMemberName = null;


function showMemberProfile(
    member
) {

    currentProfileMemberName =
        member.name;


    const memberTasks =
        tasks.filter(
            task =>
                task.mainPIC ===
                member.name ||
                (
                    task.assigned &&
                    task.assigned.includes(
                        member.name
                    )
                )
        );


    const allTasks =
        memberTasks.length;


    const overdue =
        memberTasks.filter(
            task =>
                task.status !== "Done" &&
                getDaysLeft(
                    task.deadline
                ) < 0
        ).length;


    const dueSoon =
        memberTasks.filter(
            task =>
                task.status !== "Done" &&
                getDaysLeft(
                    task.deadline
                ) >= 0 &&
                getDaysLeft(
                    task.deadline
                ) <= 3
        ).length;


    const completed =
        memberTasks.filter(
            task =>
                task.status === "Done"
        ).length;


    const totalProgress =
        memberTasks.length
            ? Math.round(
                memberTasks.reduce(
                    (
                        sum,
                        task
                    ) =>
                        sum +
                        Number(
                            task.progress || 0
                        ),
                    0
                ) /
                memberTasks.length
            )
            : 0;


    let profile =
        getElement(
            "memberProfileModal"
        );


    if (!profile) {

        profile =
            document.createElement(
                "div"
            );


        profile.id =
            "memberProfileModal";


        profile.className =
            "task-modal";


        profile.innerHTML = `

            <div
                class="modal-content"
                style="
                    max-width:900px;
                    max-height:90vh;
                    overflow:auto;
                "
            >

                <button
                    onclick="closeMemberProfile()"
                    style="
                        float:right;
                        border:none;
                        background:none;
                        font-size:25px;
                        cursor:pointer;
                    "
                >
                    ✕
                </button>


                <div id="memberProfileContent"></div>

            </div>

        `;


        document.body.appendChild(
            profile
        );

    }


    const content =
        getElement(
            "memberProfileContent"
        );


    content.innerHTML = `

        <div class="profile-header">

            <div
                class="avatar"
                style="
                    width:70px;
                    height:70px;
                    font-size:28px;
                "
            >

                ${getAvatarHtml(member.name)}

            </div>


            <div>

                <h1>
                    👤 ${member.name}
                </h1>

                <p>
                    ${member.email}
                </p>

            </div>

        </div>


        <hr>


        <div
            class="profile-stats"
            style="
                display:grid;
                grid-template-columns:
                    repeat(
                        auto-fit,
                        minmax(140px,1fr)
                    );
                gap:15px;
                margin:20px 0;
            "
        >

            <div class="stat-card">

                <strong>
                    ${allTasks}
                </strong>

                <span>
                    📋 All My Tasks
                </span>

            </div>


            <div class="stat-card">

                <strong>
                    ${overdue}
                </strong>

                <span>
                    🔴 Overdue
                </span>

            </div>


            <div class="stat-card">

                <strong>
                    ${dueSoon}
                </strong>

                <span>
                    🟠 Due in 3 Days
                </span>

            </div>


            <div class="stat-card">

                <strong>
                    ${completed}
                </strong>

                <span>
                    🟢 Completed
                </span>

            </div>

        </div>


        <div style="margin:25px 0">

            <h2>
                📊 My Progress
            </h2>


            <div
                style="
                    width:100%;
                    height:14px;
                    background:#e9eaf2;
                    border-radius:20px;
                    overflow:hidden;
                "
            >

                <div
                    style="
                        width:${totalProgress}%;
                        height:100%;
                        background:#5b4bdb;
                        border-radius:20px;
                    "
                ></div>

            </div>


            <strong>
                ${totalProgress}%
            </strong>

        </div>


        <h2>
            📋 My Task List
        </h2>


        <div class="profile-task-list">

            ${
                memberTasks.length === 0
                    ? `
                        <p>
                            🎉 No tasks assigned.
                        </p>
                    `
                    :
                    memberTasks
                        .map(
                            task =>
                                renderProfileTask(
                                    task
                                )
                        )
                        .join("")
            }

        </div>


        <div style="margin-top:25px">

            <button
                onclick="showMemberCalendar('${member.name}')"
            >

                📅 My Calendar

            </button>

        </div>

    `;


    profile.classList.remove(
        "hidden"
    );


    profile.style.display =
        "flex";

}


// ============================================================
// PROFILE TASK
// ============================================================

function renderProfileTask(
    task
) {

    const deadline =
        getDeadlineStatus(
            task
        );


    const icon =
        deadline.type === "overdue"
            ? "🔴"
            : deadline.type === "urgent"
                ? "🚨"
                : deadline.type === "warning"
                    ? "🟠"
                    : deadline.type === "done"
                        ? "🟢"
                        : "🔵";


    return `

        <div
            class="profile-task"
            style="
                padding:15px;
                border:1px solid #e5e7eb;
                border-radius:12px;
                margin:10px 0;
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    gap:15px;
                "
            >

                <strong>
                    ${icon}
                    ${task.name}
                </strong>


                <span>
                    ${task.progress || 0}%
                </span>

            </div>


            <p>

                Main PIC:
                ${task.mainPIC}

            </p>


            <p>

                Status:
                ${task.status}

            </p>


            <p>

                Deadline:
                ${task.deadline}

                ·

                ${deadline.text}

            </p>


            <div
                style="
                    height:8px;
                    background:#eee;
                    border-radius:10px;
                    overflow:hidden;
                "
            >

                <div
                    style="
                        width:${task.progress || 0}%;
                        height:100%;
                        background:#5b4bdb;
                    "
                ></div>

            </div>


            ${
                (task.subtasks || []).length > 0
                    ? `
                        <div style="margin-top:12px">

                            <small>
                                🗂️ Checklist
                                (${getSubtaskStats(task).done}/${getSubtaskStats(task).total})
                            </small>

                            <div style="margin-top:6px">

                                ${
                                    task.subtasks
                                        .map(
                                            (item, index) => `
                                                <label
                                                    style="
                                                        display:flex;
                                                        align-items:center;
                                                        gap:8px;
                                                        padding:5px 0;
                                                        font-size:12px;
                                                        cursor:pointer;
                                                    "
                                                >
                                                    <input
                                                        type="checkbox"
                                                        ${item.done ? "checked" : ""}
                                                        onchange="toggleProfileSubtask(${task.id}, ${index})"
                                                    >
                                                    <span style="${item.done ? "text-decoration:line-through;color:#9aa0ac;" : ""}">
                                                        ${item.text}
                                                    </span>
                                                </label>
                                            `
                                        )
                                        .join("")
                                }

                            </div>

                        </div>
                    `
                    : ""
            }


            <br>


            <button
                onclick="editTask(${task.id})"
            >

                ✏️ Edit

            </button>

        </div>

    `;

}


// ============================================================
// TOGGLE SUBTASK FROM PROFILE VIEW
// ============================================================

function toggleProfileSubtask(
    taskId,
    subtaskIndex
) {

    if (isLecturer()) {

        showToast("View-only access — lecturers cannot edit checklists.");

        return;

    }

    const task =
        tasks.find(
            item =>
                item.id === taskId
        );

    if (
        !task ||
        !task.subtasks ||
        !task.subtasks[subtaskIndex]
    ) {
        return;
    }

    task.subtasks[subtaskIndex].done =
        !task.subtasks[subtaskIndex].done;

    saveData();

    renderTasks();

    updateDashboard();

    if (
        currentProfileMemberName
    ) {

        const member =
            members.find(
                item =>
                    item.name ===
                    currentProfileMemberName
            );

        if (member) {

            showMemberProfile(
                member
            );

        }

    }

}


// ============================================================
// CLOSE PROFILE
// ============================================================

function closeMemberProfile() {

    const profile =
        getElement(
            "memberProfileModal"
        );


    if (profile) {

        profile.style.display =
            "none";

        profile.classList.add(
            "hidden"
        );

    }

}


// ============================================================
// SHOW MEMBER CALENDAR
// ============================================================

function showMemberCalendar(
    memberName
) {

    const member =
        members.find(
            person =>
                person.name ===
                memberName
        );


    if (!member) {
        return;
    }


    const memberTasks =
        tasks.filter(
            task =>
                task.mainPIC ===
                memberName ||
                (
                    task.assigned &&
                    task.assigned.includes(
                        memberName
                    )
                )
        );


    let html = `

        <div
            style="
                margin-top:25px;
            "
        >

            <h2>
                📅 ${memberName}'s Calendar
            </h2>

    `;


    if (
        memberTasks.length === 0
    ) {

        html += `

            <p>
                No tasks on calendar.
            </p>

        `;

    }

    else {

        memberTasks
            .sort(
                (
                    a,
                    b
                ) =>
                    String(
                        a.deadline || ""
                    ).localeCompare(
                        String(
                            b.deadline || ""
                        )
                    )
            )
            .forEach(
                task => {

                    const deadline =
                        getDeadlineStatus(
                            task
                        );


                    html += `

                        <div
                            style="
                                padding:12px;
                                margin:8px 0;
                                border-left:
                                    4px solid #5b4bdb;
                                background:#f8f8fb;
                                border-radius:8px;
                            "
                        >

                            <strong>
                                ${task.name}
                            </strong>

                            <br>

                            📅 ${task.deadline}

                            <br>

                            ${deadline.text}

                        </div>

                    `;

                }
            );

    }


    html += `</div>`;


    const content =
        getElement(
            "memberProfileContent"
        );


    if (content) {

        content.innerHTML +=
            html;

    }

}


// ============================================================
// CONTRIBUTION REPORT (PDF export — leader only)
// ============================================================

function getMemberStats(memberName) {

    const memberTasks =
        tasks.filter(
            task =>
                task.mainPIC === memberName ||
                (task.assigned && task.assigned.includes(memberName))
        );

    const overdue =
        memberTasks.filter(
            task =>
                task.status !== "Done" &&
                getDaysLeft(task.deadline) < 0
        ).length;

    const dueSoon =
        memberTasks.filter(
            task =>
                task.status !== "Done" &&
                getDaysLeft(task.deadline) >= 0 &&
                getDaysLeft(task.deadline) <= 3
        ).length;

    const completed =
        memberTasks.filter(
            task => task.status === "Done"
        ).length;

    const avgProgress =
        memberTasks.length
            ? Math.round(
                memberTasks.reduce(
                    (sum, task) => sum + Number(task.progress || 0),
                    0
                ) / memberTasks.length
            )
            : 0;

    const activityCount =
        activityLog.filter(
            entry => entry.user === memberName
        ).length;

    const commentCount =
        tasks.reduce(
            (sum, task) =>
                sum + (task.comments || []).filter(c => c.author === memberName).length,
            0
        ) +
        resources.reduce(
            (sum, resource) =>
                sum + (resource.comments || []).filter(c => c.author === memberName).length,
            0
        );

    return {
        memberTasks,
        total: memberTasks.length,
        overdue,
        dueSoon,
        completed,
        avgProgress,
        activityCount,
        commentCount
    };

}


function generateContributionReport(memberName) {

    if (!isGroupLeader()) {

        showToast(`Only ${LEADER_NAME} can generate contribution reports.`);

        return;

    }

    if (typeof window.jspdf === "undefined") {

        showToast("PDF library failed to load. Please check your internet connection and try again.");

        return;

    }

    const member =
        members.find(item => item.name === memberName);

    if (!member) {

        showToast("Member not found.");

        return;

    }

    const stats = getMemberStats(memberName);

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();

    const pageHeight = doc.internal.pageSize.getHeight();

    const margin = 15;

    const contentWidth = pageWidth - margin * 2;


    // BRAND COLOURS

    const primary = [37, 99, 235];

    const primaryDark = [29, 78, 216];

    const violet = [124, 58, 237];

    const dark = [22, 25, 43];

    const muted = [124, 132, 150];

    const border = [231, 235, 243];

    const success = [34, 197, 94];

    const successBg = [233, 251, 240];

    const danger = [239, 68, 68];

    const dangerBg = [254, 236, 236];

    const warning = [245, 158, 11];

    const warningBg = [255, 247, 230];

    const grayBg = [241, 242, 247];


    function statusColor(status) {

        if (status === "Done") return { fg: success, bg: successBg };

        if (status === "In Progress") return { fg: primary, bg: [239, 244, 255] };

        if (status === "Blocked") return { fg: danger, bg: dangerBg };

        return { fg: [110, 118, 134], bg: grayBg };

    }


    function checkPageBreak(neededSpace, y) {

        if (y + neededSpace > pageHeight - 22) {

            doc.addPage();

            return 20;

        }

        return y;

    }


    // ---------------------------------------------------------
    // HEADER BANNER
    // ---------------------------------------------------------

    doc.setFillColor(...primary);

    doc.rect(0, 0, pageWidth, 38, "F");

    doc.setFillColor(...violet);

    doc.circle(pageWidth - 12, -8, 26, "F");

    doc.setTextColor(255, 255, 255);

    doc.setFontSize(19);

    doc.setFont(undefined, "bold");

    doc.text("Individual Contribution Report", margin, 18);

    doc.setFontSize(10.5);

    doc.setFont(undefined, "normal");

    doc.text("Design Project — Group Progress Tracker", margin, 27);

    doc.setFontSize(8.5);

    doc.text(`Generated ${new Date().toLocaleString()}  ·  by ${LEADER_NAME} (Group Leader)`, margin, 34);


    let y = 50;


    // ---------------------------------------------------------
    // MEMBER INFO CARD
    // ---------------------------------------------------------

    doc.setFillColor(...grayBg);

    doc.roundedRect(margin, y, contentWidth, 22, 3, 3, "F");

    doc.setFillColor(...primary);

    doc.circle(margin + 13, y + 11, 9, "F");

    doc.setTextColor(255, 255, 255);

    doc.setFontSize(12);

    doc.setFont(undefined, "bold");

    doc.text(member.name.charAt(0).toUpperCase(), margin + 13, y + 14, { align: "center" });

    doc.setTextColor(...dark);

    doc.setFontSize(13);

    doc.text(member.name, margin + 28, y + 10);

    doc.setFontSize(9);

    doc.setFont(undefined, "normal");

    doc.setTextColor(...muted);

    doc.text(member.email, margin + 28, y + 17);

    y += 34;


    // ---------------------------------------------------------
    // STAT CARDS (4 across)
    // ---------------------------------------------------------

    const cardGap = 6;

    const cardWidth = (contentWidth - cardGap * 3) / 4;

    const cardData = [
        { label: "TOTAL TASKS", value: String(stats.total), fg: primary },
        { label: "COMPLETED", value: String(stats.completed), fg: success },
        { label: "OVERDUE", value: String(stats.overdue), fg: danger },
        { label: "AVG PROGRESS", value: `${stats.avgProgress}%`, fg: violet }
    ];

    cardData.forEach((card, index) => {

        const x = margin + index * (cardWidth + cardGap);

        doc.setFillColor(250, 250, 252);

        doc.setDrawColor(...border);

        doc.roundedRect(x, y, cardWidth, 26, 3, 3, "FD");

        doc.setFillColor(...card.fg);

        doc.roundedRect(x, y, cardWidth, 2.2, 1, 1, "F");

        doc.setTextColor(...card.fg);

        doc.setFontSize(16);

        doc.setFont(undefined, "bold");

        doc.text(card.value, x + cardWidth / 2, y + 15, { align: "center" });

        doc.setTextColor(...muted);

        doc.setFontSize(6.8);

        doc.setFont(undefined, "bold");

        doc.text(card.label, x + cardWidth / 2, y + 21, { align: "center" });

    });

    y += 36;


    // Secondary small stats line

    doc.setFontSize(9);

    doc.setFont(undefined, "normal");

    doc.setTextColor(...muted);

    doc.text(
        `Due soon (3 days): ${stats.dueSoon}   ·   Activity log entries: ${stats.activityCount}   ·   Comments posted: ${stats.commentCount}`,
        margin,
        y
    );

    y += 10;


    // ---------------------------------------------------------
    // TASK DETAIL TABLE
    // ---------------------------------------------------------

    doc.setTextColor(...dark);

    doc.setFontSize(12.5);

    doc.setFont(undefined, "bold");

    doc.text("Task Detail", margin, y);

    y += 3;

    doc.setDrawColor(...primary);

    doc.setLineWidth(0.8);

    doc.line(margin, y, margin + 24, y);

    doc.setLineWidth(0.2);

    y += 8;


    if (stats.memberTasks.length === 0) {

        doc.setFontSize(9.5);

        doc.setFont(undefined, "italic");

        doc.setTextColor(...muted);

        doc.text("No tasks assigned to this member yet.", margin, y);

        y += 8;

    }

    else {

        // table header

        doc.setFillColor(...dark);

        doc.rect(margin, y, contentWidth, 8, "F");

        doc.setTextColor(255, 255, 255);

        doc.setFontSize(8);

        doc.setFont(undefined, "bold");

        doc.text("TASK", margin + 3, y + 5.5);

        doc.text("STATUS", margin + 92, y + 5.5);

        doc.text("PROGRESS", margin + 125, y + 5.5);

        doc.text("DEADLINE", margin + 155, y + 5.5);

        y += 8;

        stats.memberTasks.forEach((task, index) => {

            y = checkPageBreak(11, y);

            const rowH = 11;

            if (index % 2 === 0) {

                doc.setFillColor(249, 250, 252);

                doc.rect(margin, y, contentWidth, rowH, "F");

            }

            doc.setTextColor(...dark);

            doc.setFontSize(8.5);

            doc.setFont(undefined, "normal");

            const shortName =
                task.name.length > 42 ? task.name.slice(0, 40) + "…" : task.name;

            doc.text(shortName, margin + 3, y + 7);

            const sc = statusColor(task.status);

            doc.setFillColor(...sc.bg);

            const badgeWidth = doc.getTextWidth(task.status) + 6;

            doc.roundedRect(margin + 92, y + 2.5, badgeWidth, 6, 2, 2, "F");

            doc.setTextColor(...sc.fg);

            doc.setFontSize(7.5);

            doc.setFont(undefined, "bold");

            doc.text(task.status, margin + 95, y + 6.8);

            doc.setTextColor(...dark);

            doc.setFontSize(8.5);

            doc.setFont(undefined, "normal");

            doc.text(`${task.progress || 0}%`, margin + 125, y + 7);

            doc.setTextColor(...muted);

            doc.text(task.deadline || "-", margin + 155, y + 7);

            y += rowH;

        });

        doc.setDrawColor(...border);

        doc.line(margin, y, margin + contentWidth, y);

        y += 10;

    }


    // ---------------------------------------------------------
    // TEAM COMPARISON
    // ---------------------------------------------------------

    y = checkPageBreak(60, y);

    doc.setTextColor(...dark);

    doc.setFontSize(12.5);

    doc.setFont(undefined, "bold");

    doc.text("Team Comparison", margin, y);

    y += 3;

    doc.setDrawColor(...violet);

    doc.setLineWidth(0.8);

    doc.line(margin, y, margin + 24, y);

    doc.setLineWidth(0.2);

    y += 9;

    doc.setFillColor(...dark);

    doc.rect(margin, y, contentWidth, 8, "F");

    doc.setTextColor(255, 255, 255);

    doc.setFontSize(8);

    doc.setFont(undefined, "bold");

    doc.text("MEMBER", margin + 3, y + 5.5);

    doc.text("TASKS", margin + 95, y + 5.5);

    doc.text("AVG PROGRESS", margin + 125, y + 5.5);

    doc.text("COMPLETED", margin + contentWidth - 3, y + 5.5, { align: "right" });

    y += 8;

    members.forEach((item, index) => {

        y = checkPageBreak(10, y);

        const itemStats = getMemberStats(item.name);

        const isTarget = item.name === memberName;

        const rowH = 9.5;

        doc.setFillColor(isTarget ? 239 : 249, isTarget ? 244 : 250, isTarget ? 255 : 252);

        doc.rect(margin, y, contentWidth, rowH, "F");

        if (isTarget) {

            doc.setFillColor(...primary);

            doc.rect(margin, y, 1.5, rowH, "F");

        }

        doc.setTextColor(isTarget ? primary[0] : dark[0], isTarget ? primary[1] : dark[1], isTarget ? primary[2] : dark[2]);

        doc.setFontSize(9);

        doc.setFont(undefined, isTarget ? "bold" : "normal");

        doc.text(item.name + (isTarget ? "  (this report)" : ""), margin + 5, y + 6.5);

        doc.text(String(itemStats.total), margin + 95, y + 6.5);

        doc.text(`${itemStats.avgProgress}%`, margin + 125, y + 6.5);

        doc.text(String(itemStats.completed), margin + contentWidth - 3, y + 6.5, { align: "right" });

        y += rowH;

    });


    // ---------------------------------------------------------
    // FOOTER (all pages)
    // ---------------------------------------------------------

    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {

        doc.setPage(i);

        doc.setDrawColor(...border);

        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        doc.setFontSize(7.5);

        doc.setFont(undefined, "normal");

        doc.setTextColor(...muted);

        doc.text("Design Project Group Tracker — Confidential", margin, pageHeight - 9);

        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 9, { align: "right" });

    }


    doc.save(`${memberName.replace(/[^a-zA-Z0-9]/g, "_")}_Contribution_Report.pdf`);

    logActivity(`generated a contribution report for ${memberName}`);

}


// ============================================================
// CALENDAR
// ============================================================

let calendarDate =
    new Date();


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


// ============================================================
// RENDER CALENDAR
// ============================================================

let calendarSelectedDate = null;
let calendarAudience = "team";

function renderCalendar() {
    const grid=getElement("calendarGrid"), title=getElement("calendarMonth"), panel=getElement("calendarDayPanel");
    if(!grid || !title || !panel)return;
    const currentMember = getCurrentUser();
    const canUseMine = !!currentMember && !isLecturer();
    if (!canUseMine) calendarAudience = "team";
    let audience = getElement("calendarAudience");
    if (!audience) {
        audience = document.createElement("div");
        audience.id = "calendarAudience";
        audience.className = "calendar-audience";
        audience.setAttribute("role", "group");
        audience.setAttribute("aria-label", "Calendar task filter");
        const controls = document.querySelector("#calendar .calendar-controls");
        if (controls) controls.prepend(audience);
    }
    audience.replaceChildren();
    for (const mode of ["team", "mine"]) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = mode === "mine" ? "Mine" : "Team";
        button.setAttribute("aria-pressed", String(calendarAudience === mode));
        button.disabled = mode === "mine" && !canUseMine;
        if (button.disabled) button.title = "Mine is available for team members";
        button.onclick = () => {
            calendarAudience = mode;
            renderCalendar();
            getElement("calendarAudience").querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
        };
        audience.append(button);
    }
    const includedTask = task => calendarAudience === "team" ||
        task.mainPIC === currentMember ||
        (Array.isArray(task.assigned) && task.assigned.includes(currentMember));
    const year=calendarDate.getFullYear(), month=calendarDate.getMonth();
    title.textContent=new Date(year,month,1).toLocaleDateString("en-GB",{month:"long",year:"numeric"});
    const today=formatDate(new Date()), prefix=formatDate(new Date(year,month,1)).slice(0,7);
    if(!calendarSelectedDate || !calendarSelectedDate.startsWith(prefix))
        calendarSelectedDate=today.startsWith(prefix)?today:prefix+"-01";
    const eventsFor=date=>[
        ...tasks.filter(t=>t.deadline===date && includedTask(t)).map(t=>({kind:"task",item:t})),
        ...meetings.filter(m=>m.date===date).map(m=>({kind:"meeting",item:m}))
    ];
    const select=date=>{
        calendarSelectedDate=date;
        const parsed=new Date(date+"T12:00:00");
        if(parsed.getMonth()!==month || parsed.getFullYear()!==year)calendarDate=new Date(parsed.getFullYear(),parsed.getMonth(),1);
        renderCalendar();
        getElement("calendarGrid").querySelector('[data-date="'+date+'"] .calendar-number')?.focus({preventScroll:true});
    };
    const eventClass=e=>e.kind==="meeting"?"calendar-meeting":calendarClass(getDeadlineStatus(e.item).type);
    const eventName=e=>e.kind==="meeting"?e.item.title:e.item.name;
    const open=e=>e.kind==="meeting"?editMeeting(e.item.id):openTaskDetails(e.item.id);
    grid.replaceChildren();
    const offset=(new Date(year,month,1).getDay()+6)%7;
    const total=Math.ceil((offset+new Date(year,month+1,0).getDate())/7)*7;
    for(let i=0;i<total;i++){
        const date=new Date(year,month,i-offset+1), key=formatDate(date), events=eventsFor(key);
        const cell=document.createElement("div");
        cell.className="calendar-day"+(date.getMonth()!==month?" other-month":"")+(key===today?" today":"")+(key===calendarSelectedDate?" selected-day":"");
        cell.dataset.date=key;
        const number=document.createElement("button");
        number.type="button";number.className="calendar-number";number.textContent=date.getDate();
        number.setAttribute("aria-label",date.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})+", "+events.length+" scheduled items");
        number.setAttribute("aria-pressed",String(key===calendarSelectedDate));
        if(key===today)number.setAttribute("aria-current","date");
        number.onclick=()=>select(key);cell.append(number);
        events.slice(0,2).forEach(e=>{
            const chip=document.createElement("button");
            chip.type="button";chip.className="calendar-task "+eventClass(e);
            chip.textContent=(e.kind==="meeting"?"Meeting: ":"")+eventName(e);
            chip.title=eventName(e)+(e.kind==="task"?" · "+(e.item.mainPIC||"Unassigned"):" · "+(e.item.time||"No time set"));
            chip.onclick=()=>open(e);cell.append(chip);
        });
        if(events.length>2){
            const more=document.createElement("button");more.type="button";more.className="calendar-more";
            more.textContent="+"+(events.length-2)+" more";more.setAttribute("aria-label","Show all "+events.length+" items on "+key);
            more.onclick=()=>select(key);cell.append(more);
        }
        cell.onclick=e=>{if(e.target===cell)select(key);};grid.append(cell);
    }
    const events=eventsFor(calendarSelectedDate), date=new Date(calendarSelectedDate+"T12:00:00");
    panel.replaceChildren();
    const heading=document.createElement("h3");heading.textContent=date.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
    heading.id="calendarDayTitle";heading.setAttribute("aria-live","polite");panel.append(heading);
    const count=document.createElement("p");count.className="calendar-day-count";
    count.textContent=events.filter(e=>e.kind==="task").length+" tasks · "+events.filter(e=>e.kind==="meeting").length+" meetings";panel.append(count);
    if(calendarAudience==="mine"){const note=document.createElement("p");note.className="calendar-filter-note";note.textContent="Your tasks · All team meetings";panel.append(note);}
    if(!events.length){const empty=document.createElement("p");empty.className="calendar-day-empty";empty.textContent=calendarAudience==="mine"?"No tasks assigned to you or team meetings on this date. Switch to Team to see everyone’s tasks.":"No tasks or meetings on this date. Select another day to see its schedule.";panel.append(empty);}
    events.forEach(e=>{
        const button=document.createElement("button");button.type="button";button.className="calendar-detail-item "+eventClass(e);
        const name=document.createElement("strong");name.textContent=eventName(e)||"Untitled";button.append(name);
        const detail=document.createElement("span");
        if(e.kind==="task"){
            const value=Number(e.item.progress||0), progress=Number.isFinite(value)?Math.max(0,Math.min(100,value)):0;
            detail.textContent=(e.item.mainPIC||"Unassigned")+" · "+(e.item.status||"Not Started")+" · "+progress+"%";
            const due=document.createElement("small");due.textContent=getDeadlineStatus(e.item).text;
            button.append(detail,due);
        }else{detail.textContent="Meeting · "+(e.item.time||"No time set");button.append(detail);}
        button.onclick=()=>open(e);panel.append(button);
    });
}

// ============================================================
// CALENDAR CLASS
// ============================================================

function calendarClass(
    type
) {

    if (
        type === "done"
    ) {

        return "done";

    }


    if (
        type === "overdue"
    ) {

        return "overdue";

    }


    if (
        type === "urgent"
    ) {

        return "urgent";

    }


    if (
        type === "warning"
    ) {

        return "warning";

    }


    return "normal";

}


// ============================================================
// PREVIOUS MONTH
// ============================================================

function previousMonth() {
    calendarDate.setDate(1);

    calendarDate.setMonth(
        calendarDate.getMonth() -
        1
    );


    renderCalendar();

}


// ============================================================
// NEXT MONTH
// ============================================================

function nextMonth() {
    calendarDate.setDate(1);

    calendarDate.setMonth(
        calendarDate.getMonth() +
        1
    );


    renderCalendar();

}


// ============================================================
// TODAY
// ============================================================

function goToday() {
    calendarSelectedDate = formatDate(new Date());

    calendarDate =
        new Date();


    renderCalendar();

}


// ============================================================
// EMAIL RECIPIENTS
// ============================================================
//
// MAIN PIC + ALL ASSIGNED MEMBERS
//
// Kalau Main PIC juga ada dalam Assigned,
// email hanya dihantar sekali.
// ============================================================

function getTaskRecipients(
    task
) {

    const recipientNames =
        [];


    if (
        task.mainPIC
    ) {

        recipientNames.push(
            task.mainPIC
        );

    }


    if (
        Array.isArray(
            task.assigned
        )
    ) {

        task.assigned.forEach(
            name => {

                if (
                    !recipientNames.includes(
                        name
                    )
                ) {

                    recipientNames.push(
                        name
                    );

                }

            }
        );

    }


    return recipientNames
        .map(
            name =>
                members.find(
                    member =>
                        member.name ===
                        name
                )
        )
        .filter(
            member =>
                member &&
                member.email
        );

}


// ============================================================
// EMAIL REMINDER
// ============================================================

async function sendEmailReminder(
    task,
    member
) {

    if (
        typeof emailjs ===
        "undefined"
    ) {

        return;

    }


    if (
        EMAILJS_PUBLIC_KEY ===
        "YOUR_EMAILJS_PUBLIC_KEY"
    ) {

        return;

    }


    if (
        !member ||
        !member.email
    ) {

        return;

    }


    const days =
        getDaysLeft(
            task.deadline
        );


    if (
        days !== 1
    ) {

        return;

    }


    const params = {

        to_email:
            member.email,


        member_name:
            member.name,


        task_name:
            task.name,


        deadline:
            task.deadline,


        days_left:
            days,


        progress:
            task.progress,


        main_pic:
            task.mainPIC,


        assigned_members:
            (
                task.assigned || []
            ).join(", "),

        status:
            task.status

    };


    try {

        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            params
        );


        console.log(
            "Reminder sent to:",
            member.email,
            task.name
        );

    }

    catch (
        error
    ) {

        console.error(
            "Email failed:",
            error
        );

    }

}


// ============================================================
// EMAIL REMINDER TRACKING
// ============================================================
//
// Elak email yang sama dihantar berkali-kali
// setiap kali refresh.
// ============================================================


// ============================================================
// SHARED (FIRESTORE) EMAIL REMINDER LOG
// ============================================================
//
// The old localStorage-only log was per-browser, so every device
// that had the tracker open would independently decide "I haven't
// sent this reminder yet" and send its own copy — meaning a
// member with the app open on 2 devices, or simply several
// teammates having the app open in the background, could all
// fire the same reminder email, spamming the recipient with
// duplicates. This shared Firestore log lets every client check
// (and claim) a reminder before sending, so it only goes out once
// across the whole team regardless of how many devices are open.
// ============================================================

let sharedReminderLog = {};

let sharedReminderLogLoaded = false;


function listenToReminderLog() {

    if (!db) return;

    db.collection("trackerData")
        .doc("emailReminderLog")
        .onSnapshot(
            doc => {

                sharedReminderLog = doc.exists ? (doc.data() || {}) : {};

                sharedReminderLogLoaded = true;

                checkEmailReminders();

            },
            error => {

                console.error("Reminder log sync error:", error);

            }
        );

}


function claimReminderKey(key) {

    if (!db) return false;

    // Optimistic local claim first so a rapid loop within the same
    // client (e.g. several tasks/recipients in one pass) doesn't
    // also double-send before Firestore confirms the write.
    if (sharedReminderLog[key]) {

        return false;

    }

    sharedReminderLog[key] = true;

    db.collection("trackerData")
        .doc("emailReminderLog")
        .set({ [key]: true }, { merge: true })
        .catch(error => {

            console.error("Failed to claim reminder key:", error);

        });

    return true;

}


// ============================================================
// CHECK EMAIL REMINDERS
// ============================================================

function checkEmailReminders() {

    if (
        EMAILJS_PUBLIC_KEY ===
        "YOUR_EMAILJS_PUBLIC_KEY"
    ) {

        return;

    }

    // Wait until the shared log has loaded at least once, so we don't
    // send reminders based on an empty/incomplete local view of what
    // has already gone out today.
    if (!sharedReminderLogLoaded) {

        return;

    }


    const today =
        formatDate(
            new Date()
        );


    tasks.forEach(
        task => {


            if (
                task.status ===
                "Done"
            ) {

                return;

            }


            const days =
                getDaysLeft(
                    task.deadline
                );


            if (
        days !== 1
    ) {

        return;

    }


            const recipients =
                getTaskRecipients(
                    task
                );


            recipients.forEach(
                member => {


                    const key =
                        `${task.id}_${member.name}_${today}`;


                    if (
                        !claimReminderKey(key)
                    ) {

                        return;

                    }


                    sendEmailReminder(
                        task,
                        member
                    );

                }
            );

        }
    );

}


// ============================================================
// STATUS <-> PROGRESS SYNC
// ============================================================
//
// "Done"        -> progress dikunci ke 100%
// "Not Started" -> progress dikunci ke 0%
// Status lain   -> progress boleh edit bebas
// ============================================================

function syncProgressWithStatus() {

    const statusElement =
        getElement(
            "taskStatus"
        );

    const progressElement =
        getElement(
            "taskProgress"
        );

    if (
        !statusElement ||
        !progressElement
    ) {
        return;
    }

    if (
        statusElement.value ===
        "Done"
    ) {

        progressElement.value =
            100;

        progressElement.disabled =
            true;

    }

    else if (
        statusElement.value ===
        "Not Started"
    ) {

        progressElement.value =
            0;

        progressElement.disabled =
            true;

    }

    else {

        progressElement.disabled =
            false;

    }

}


function setupStatusProgressSync() {

    const statusElement =
        getElement(
            "taskStatus"
        );

    if (statusElement) {

        statusElement.addEventListener(
            "change",
            syncProgressWithStatus
        );

    }

}


// ============================================================
// SEARCH EVENTS
// ============================================================

function setupSearchEvents() {

    const search =
        getElement(
            "search"
        );


    if (search) {

        search.addEventListener(
            "input",
            renderTasks
        );

    }


    const filterMember =
        getElement(
            "filterMember"
        );


    if (filterMember) {

        filterMember.addEventListener(
            "change",
            renderTasks
        );

    }


    const filterStatus =
        getElement(
            "filterStatus"
        );


    if (filterStatus) {

        filterStatus.addEventListener(
            "change",
            renderTasks
        );

    }


    const filterPriority =
        getElement(
            "filterPriority"
        );


    if (filterPriority) {

        filterPriority.addEventListener(
            "change",
            renderTasks
        );

    }


    const filterChapter = getElement("filterChapter");

    if (filterChapter) {
        filterChapter.addEventListener("change", handleChapterFilterChange);
    }


    const filterEquipment = getElement("filterEquipment");

    if (filterEquipment) {
        filterEquipment.addEventListener("change", renderTasks);
    }

}


// ============================================================
// RESET FILTER
// ============================================================

function resetFilters() {

    const search =
        getElement(
            "search"
        );


    if (search) {

        search.value = "";

    }


    const filterMember =
        getElement(
            "filterMember"
        );


    if (filterMember) {

        filterMember.value =
            "All";

    }


    const filterStatus =
        getElement(
            "filterStatus"
        );


    if (filterStatus) {

        filterStatus.value =
            "All";

    }


    const filterPriority =
        getElement(
            "filterPriority"
        );


    if (filterPriority) {

        filterPriority.value =
            "All";

    }


    const filterChapter = getElement("filterChapter");
    const filterEquipment = getElement("filterEquipment");

    if (filterChapter) filterChapter.value = "All";

    updateEquipmentFilterOptions();

    if (filterEquipment) filterEquipment.value = "All";


    filterLecturerStatusValue = "All";


    const showApprovedToggle =
        getElement(
            "showApprovedToggle"
        );


    if (showApprovedToggle) {

        showApprovedToggle.checked = false;

    }


    renderTasks();

}


// ============================================================
// LOGIN IDENTITY
// ============================================================
//
// Firebase Authentication validates the account first. Local storage
// is only used to keep the authenticated name and role in the UI.
// ============================================================

function getCurrentUser() {

    return localStorage.getItem(
        "designProjectCurrentUser"
    );

}


function renderLoginScreen() {

    const container =
        getElement(
            "loginMemberList"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    members.forEach(
        member => {

            const button =
                document.createElement(
                    "button"
                );

            button.className =
                "login-member-btn";

            button.innerHTML = `

                <span class="avatar">
                    ${getAvatarHtml(member.name)}
                </span>

                <span>
                    ${member.name}${member.name === LEADER_NAME ? ' <span class="leader-badge" title="Group Leader">👑</span>' : ""}
                </span>

                <span class="arrow">
                    →
                </span>

            `;

            button.onclick =
                () =>
                    selectUser(
                        member.name
                    );

            container.appendChild(
                button
            );

        }
    );

}


let pendingPinUser = null;


function loginAsLecturer() {

    if (LECTURER.email.startsWith("YOUR_")) {
        showToast("Set the lecturer email in app.js before signing in.");
        return;
    }

    pendingPinUser = LECTURER;
    openPinModal(LECTURER);

}


// ============================================================
// MOBILE SIDEBAR
// ============================================================

function toggleMobileSidebar() {

    const sidebar = getElement("sidebar");

    if (!sidebar) {
        return;
    }

    if (sidebar.classList.contains("mobile-open")) {
        closeMobileSidebar();
        return;
    }

    const overlay = getElement("mobileSidebarOverlay");
    const button = getElement("mobileMenuBtn");

    sidebar.classList.add("mobile-open");
    document.body.classList.add("mobile-sidebar-open");

    if (overlay) {
        overlay.classList.remove("hidden");
    }

    if (button) {
        button.setAttribute("aria-expanded", "true");
        button.setAttribute("aria-label", "Close navigation menu");
    }

}


function closeMobileSidebar() {

    const sidebar = getElement("sidebar");
    const overlay = getElement("mobileSidebarOverlay");
    const button = getElement("mobileMenuBtn");

    if (sidebar) {
        sidebar.classList.remove("mobile-open");
    }

    document.body.classList.remove("mobile-sidebar-open");

    if (overlay) {
        overlay.classList.add("hidden");
    }

    if (button) {
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "Open navigation menu");
    }

}


function setupMobileSidebar() {

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {
            closeMobileSidebar();
        }

    });

    window.addEventListener("resize", () => {

        if (window.innerWidth > 650) {
            closeMobileSidebar();
        }

    });

}


function selectUser(name) {

    const member =
        members.find(
            item => item.name === name
        );

    if (!member) return;

    pendingPinUser = member;

    openPinModal(member);

}


function openPinModal(member) {

    const modal = getElement("pinModal");

    if (!modal) return;

    const avatar = getElement("pinAvatar");

    if (avatar) {

        avatar.innerHTML = getAvatarHtml(member.name);

    }

    const nameLabel = getElement("pinModalName");

    if (nameLabel) {

        nameLabel.textContent = `Sign in as ${member.name}`;

    }

    const errorLabel = getElement("pinError");

    if (errorLabel) {

        errorLabel.classList.add("hidden");

    }

    const input = getElement("pinInput");

    if (input) {

        input.value = "";

    }

    const visibilityButton = getElement("pinVisibilityBtn");

    if (input) {
        input.type = "password";
    }

    if (visibilityButton) {
        visibilityButton.textContent = "Show";
        visibilityButton.setAttribute("aria-label", "Show PIN");
        visibilityButton.setAttribute("aria-pressed", "false");
    }

    setPinLoading(false);

    modal.classList.remove("hidden");

    if (input) {

        setTimeout(() => input.focus(), 50);

    }

}


function closePinModal() {

    const modal = getElement("pinModal");

    if (modal) {

        modal.classList.add("hidden");

    }

    pendingPinUser = null;

    setPinLoading(false);

}


function togglePinVisibility() {

    const input = getElement("pinInput");
    const button = getElement("pinVisibilityBtn");

    if (!input || !button) {
        return;
    }

    const showPin = input.type === "password";

    input.type = showPin ? "text" : "password";
    button.textContent = showPin ? "Hide" : "Show";
    button.setAttribute("aria-label", showPin ? "Hide PIN" : "Show PIN");
    button.setAttribute("aria-pressed", String(showPin));

}


function setPinLoading(isLoading) {

    const submitButton = getElement("pinSubmitBtn");
    const input = getElement("pinInput");
    const visibilityButton = getElement("pinVisibilityBtn");

    if (submitButton) {
        submitButton.disabled = isLoading;
        submitButton.textContent = isLoading ? "Checking..." : "Continue →";
    }

    if (input) {
        input.disabled = isLoading;
    }

    if (visibilityButton) {
        visibilityButton.disabled = isLoading;
    }

}


function submitPin(event) {

    event.preventDefault();

    if (!pendingPinUser || !auth) {
        showToast("Authentication is not ready. Please refresh and try again.");
        return false;
    }

    const input = getElement("pinInput");
    const password = input ? input.value : "";

    if (!password) {
        const errorLabel = getElement("pinError");

        if (errorLabel) {
            errorLabel.textContent = "Please enter your account password.";
            errorLabel.classList.remove("hidden");
        }

        return false;
    }

    setPinLoading(true);

    auth.signInWithEmailAndPassword(pendingPinUser.email, password)
        .then(() => {
            // onAuthStateChanged completes the approved login flow.
            closePinModal();
        })
        .catch(error => {

            console.error("Sign-in failed:", error);
            setPinLoading(false);

            const errorLabel = getElement("pinError");

            if (errorLabel) {
                errorLabel.textContent = "Incorrect email or password. Please try again.";
                errorLabel.classList.remove("hidden");
            }

            if (input) {
                input.value = "";
                input.focus();
            }

        });

    return false;

}


function isLecturer() {

    return localStorage.getItem(
        "designProjectCurrentRole"
    ) === "lecturer";

}


function logoutUser() {

    const modal = getElement("logoutModal");
    const userName = getElement("logoutUserName");

    if (!modal) {
        confirmLogout();
        return;
    }

    if (userName) {
        userName.textContent = getCurrentUser() || "Current user";
    }

    modal.classList.remove("hidden");

}


function closeLogoutModal() {

    const modal = getElement("logoutModal");

    if (modal) {
        modal.classList.add("hidden");
    }

}


async function confirmLogout() {

    await releaseTeamPresence();

    closeLogoutModal();

    if (auth) {
        auth.signOut().catch(error => {
            console.error("Sign-out failed:", error);
            showToast("Unable to sign out. Please try again.");
        });
        return;
    }

    localStorage.removeItem("designProjectCurrentUser");
    localStorage.removeItem("designProjectCurrentRole");
    location.reload();

}


// ============================================================
// AUTO LOGOUT AFTER INACTIVITY
// ============================================================
//
// Team accounts log out after 5 idle minutes. Shamiel keeps the
// Firebase-persisted session until explicit logout or session invalidation.
// ============================================================

const AUTO_LOGOUT_MINUTES = 5;

let inactivityTimer = null;

function hasPersistentLeaderSession() {
    const user = auth && auth.currentUser;
    const account = user && getAccountByEmail(user.email);
    return !!account && account.name === LEADER_NAME;
}


function resetInactivityTimer() {

    if (
        inactivityTimer
    ) {

        clearTimeout(
            inactivityTimer
        );

    }

    inactivityTimer = null;

    // Use the authenticated account, never the cached display name.
    if (hasPersistentLeaderSession()) return;

    inactivityTimer =
        setTimeout(
            () => {

                if (
                    getCurrentUser() && !hasPersistentLeaderSession()
                ) {

                    showToast(
                        "You've been logged out due to inactivity."
                    );

                    if (auth) {
                        auth.signOut();
                    }

                    else {
                        localStorage.removeItem("designProjectCurrentUser");
                        localStorage.removeItem("designProjectCurrentRole");
                        location.reload();
                    }

                }

            },
            AUTO_LOGOUT_MINUTES *
            60 *
            1000
        );

}


function setupAutoLogout() {

    const activityEvents = [

        "mousemove",
        "mousedown",
        "keydown",
        "scroll",
        "touchstart",
        "click"

    ];

    activityEvents.forEach(
        eventName => {

            document.addEventListener(
                eventName,
                resetInactivityTimer,
                {
                    passive: true
                }
            );

        }
    );

    resetInactivityTimer();

}


function renderCurrentUserBadge() {

    const container =
        getElement(
            "currentUserBadge"
        );

    if (!container) {
        return;
    }

    const name =
        getCurrentUser();

    if (!name) {
        return;
    }

    container.innerHTML = `

        <div class="user-row">

            <span class="avatar">
                ${getAvatarHtml(name)}
            </span>

            <div class="user-info">
                <small>LOGGED IN AS</small>
                <strong>${name}${isGroupLeader() ? ' <span class="leader-badge" title="Group Leader">👑</span>' : ""}</strong>
            </div>

        </div>

        <button
            class="logout-btn"
            onclick="logoutUser()"
            title="Logout"
        >
            🚪 Logout
        </button>

    `;

}


// ============================================================
// APPLY ROLE RESTRICTIONS (LECTURER = VIEW-ONLY, LIMITED NAV)
// ============================================================

function applyRoleRestrictions() {

    const lecturer = isLecturer();

    document.body.classList.toggle(
        "role-lecturer",
        lecturer
    );

    document.body.classList.toggle(
        "role-not-leader",
        !lecturer && !isGroupLeader()
    );

    const hiddenNavIds = [
        "navMyDay",
        "navMeetings",
        "navEngineering",
        "navTeam",
        "navActivity"
    ];

    hiddenNavIds.forEach(id => {

        const el = getElement(id);

        if (el) {

            el.style.display = lecturer ? "none" : "";

        }

    });

    const ganttNav = getElement("navGantt");
    if (ganttNav) ganttNav.style.display = hasPersistentLeaderSession() ? "" : "none";

    const adminNav = getElement("navAdmin");

    if (adminNav) {

        adminNav.style.display = isGroupLeader() ? "" : "none";

    }

    const leaderHubNav = getElement("navLeaderHub");

    if (leaderHubNav) {

        leaderHubNav.style.display = isGroupLeader() ? "" : "none";

    }

    renderMaintenanceOverlay();

    renderAnnouncementBanner();

    renderSubmissionCountdown();
    renderEngineeringToolAccess();

    const addResourceSectionBtn = getElement("addResourceSectionBtn");
    if (addResourceSectionBtn) addResourceSectionBtn.style.display = lecturer ? "none" : "";

    const brainstormWrap = getElement("brainstormHeaderWrap");
    if (brainstormWrap) brainstormWrap.style.display = lecturer ? "none" : "";

    if (lecturer) {
        closeBrainstormDrawer();
        closeFullBrainstorm();
        stopBrainstormListeners();
    }
    else {
        startBrainstormListeners();
    }

}


function enterApp() {

    const loginScreen =
        getElement(
            "loginScreen"
        );

    if (loginScreen) {

        loginScreen.classList.add(
            "hidden"
        );

    }

    renderCurrentUserBadge();

    renderMaintenanceOverlay();

    renderAnnouncementBanner();

    resetFilters();

    startApp();

}


// ============================================================
// START APPLICATION
// ============================================================

function startApp() {

    applyRoleRestrictions();

    setupMobileSidebar();

    renderFilterMembers();

    updateEquipmentFilterOptions();

    setupSearchEvents();

    setupStatusProgressSync();

    setupSubtaskEvents();

    setupLinkEvents();

    setupTaskCommentEvents();

    setupResourceCommentEvents();

    setupMeetingProjectLinkEvents();

    setupMomEvents();

    updateDashboard();

    renderTasks();

    renderTeam();

    renderCalendar();

    renderMeetings();

    renderChapters();

    renderMyDay();

    setupAutoLogout();

    maybeShowDailyQuotePopup();

    maybeShowCriticalAttentionPopup();

    if (isLecturer()) {

        showSection("dashboard");

    }

}




// ============================================================
// BRAINSTORM V1 — TEAM-ONLY REAL-TIME COLLABORATION
// ============================================================
// Data model:
// brainstormRooms/{roomId}
// brainstormRooms/{roomId}/messages/{messageId}
//
// Lecturer access is blocked in the client. Deploy the companion
// Firestore rules snippet for database-level protection as well.
// ============================================================

let brainstormInitialized = false;
let brainstormStarting = false;
let brainstormUnsubscribers = [];
let brainstormRoomRegistry = {};
let brainstormMessagesByRoom = {};
let brainstormActiveRoomKey = "team";
let brainstormReplyTo = null;
let brainstormAiSummaryCache = {};

function brainstormSafeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function brainstormMemberByName(name) {
    return members.find(member => member.name === name) || null;
}

function brainstormCurrentEmail() {
    const current = brainstormMemberByName(getCurrentUser());
    return current ? current.email : ((auth && auth.currentUser && auth.currentUser.email) || "");
}

function brainstormSlug(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function brainstormDmRoomKey(nameA, nameB) {
    return "dm_" + [brainstormSlug(nameA), brainstormSlug(nameB)].sort().join("_");
}

function buildBrainstormRoomRegistry() {
    const current = getCurrentUser();
    const teamEmails = members.map(member => member.email);
    const teamNames = members.map(member => member.name);

    const registry = {
        team: {
            key: "team",
            type: "team",
            title: "Team Room",
            meta: "All project members",
            pill: "TEAM",
            participantNames: teamNames,
            participantEmails: teamEmails
        }
    };

    if (current) {
        const currentMember = brainstormMemberByName(current);
        members
            .filter(member => member.name !== current)
            .forEach(member => {
                const key = brainstormDmRoomKey(current, member.name);
                registry[key] = {
                    key,
                    type: "direct",
                    title: member.name,
                    meta: "Private direct chat",
                    pill: "DIRECT",
                    participantNames: [current, member.name].sort(),
                    participantEmails: [currentMember && currentMember.email, member.email].filter(Boolean).sort()
                };
            });
    }

    brainstormRoomRegistry = registry;
    return registry;
}

function getBrainstormRoom(key = brainstormActiveRoomKey) {
    if (!brainstormRoomRegistry[key]) buildBrainstormRoomRegistry();
    return brainstormRoomRegistry[key] || brainstormRoomRegistry.team;
}

async function ensureBrainstormRoom(room) {
    if (!db || !room || isLecturer()) return;

    const payload = {
        type: room.type,
        title: room.type === "team" ? "Team Room" : "Direct Chat",
        participantNames: room.participantNames,
        participantEmails: room.participantEmails,
        updatedAt: new Date().toISOString()
    };

    await db.collection("brainstormRooms")
        .doc(room.key)
        .set(payload, { merge: true });
}

function stopBrainstormListeners() {
    brainstormUnsubscribers.forEach(unsub => {
        try { if (typeof unsub === "function") unsub(); } catch (_) {}
    });
    brainstormUnsubscribers = [];
    brainstormInitialized = false;
    brainstormStarting = false;
    brainstormMessagesByRoom = {};
    updateBrainstormUnreadBadge();
}

async function startBrainstormListeners() {
    if (isLecturer() || !db || !getCurrentUser() || brainstormInitialized || brainstormStarting) return;

    brainstormStarting = true;
    buildBrainstormRoomRegistry();

    try {
        const rooms = Object.values(brainstormRoomRegistry);

        for (const room of rooms) {
            await ensureBrainstormRoom(room);
        }

        stopBrainstormListeners();
        brainstormStarting = true;
        buildBrainstormRoomRegistry();

        Object.values(brainstormRoomRegistry).forEach(room => {
            const unsub = db.collection("brainstormRooms")
                .doc(room.key)
                .collection("messages")
                .orderBy("createdAt", "asc")
                .onSnapshot(
                    snapshot => {
                        brainstormMessagesByRoom[room.key] = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...sanitizeStoredData(doc.data())
                        }));

                        renderBrainstormAll();
                        updateBrainstormUnreadBadge();
                    },
                    error => {
                        console.error("Brainstorm listener failed:", room.key, error);
                        if (/permission/i.test(error && error.message || "")) {
                            showToast("Brainstorm needs the included Firestore security rules before chat can sync.", "warning");
                        }
                    }
                );
            brainstormUnsubscribers.push(unsub);
        });

        brainstormInitialized = true;
        populateBrainstormDirectPicker();
        renderBrainstormAll();
    }
    catch (error) {
        console.error("Brainstorm setup failed:", error);
        if (/permission/i.test(error && error.message || "")) {
            showToast("Brainstorm is ready in the UI, but Firestore rules still need to be deployed.", "warning");
        }
    }
    finally {
        brainstormStarting = false;
    }
}

function brainstormMessagesForRoom(key = brainstormActiveRoomKey) {
    return brainstormMessagesByRoom[key] || [];
}

function brainstormLastSeenMap() {
    try {
        return JSON.parse(localStorage.getItem("brainstormLastSeen") || "{}") || {};
    }
    catch (_) {
        return {};
    }
}

function brainstormRoomUnreadCount(key) {
    const current = getCurrentUser();
    const lastSeen = brainstormLastSeenMap()[key] || "";
    return brainstormMessagesForRoom(key).filter(message =>
        message.sender !== current && (message.createdAt || "") > lastSeen
    ).length;
}

function markBrainstormRoomSeen(key = brainstormActiveRoomKey) {
    const messages = brainstormMessagesForRoom(key);
    const latest = messages.length ? (messages[messages.length - 1].createdAt || new Date().toISOString()) : new Date().toISOString();
    const map = brainstormLastSeenMap();
    map[key] = latest;
    localStorage.setItem("brainstormLastSeen", JSON.stringify(map));
    updateBrainstormUnreadBadge();
    renderBrainstormFullRoomList();
}

function updateBrainstormUnreadBadge() {
    const badge = getElement("brainstormBadge");
    if (!badge) return;

    if (isLecturer()) {
        badge.classList.add("hidden");
        return;
    }

    const total = Object.keys(brainstormRoomRegistry).reduce((sum, key) => sum + brainstormRoomUnreadCount(key), 0);
    badge.textContent = total > 99 ? "99+" : total;
    badge.classList.toggle("hidden", total === 0);
}

function populateBrainstormDirectPicker() {
    const select = getElement("brainstormDirectSelect");
    if (!select || isLecturer()) return;

    const current = getCurrentUser();
    const others = members.filter(member => member.name !== current);
    const activeRoom = getBrainstormRoom();

    select.innerHTML = others.map(member =>
        `<option value="${brainstormSafeHtml(member.name)}">${brainstormSafeHtml(member.name)}</option>`
    ).join("");

    if (activeRoom && activeRoom.type === "direct") {
        select.value = activeRoom.title;
    }
}

function selectBrainstormMode(mode) {
    if (isLecturer()) return;

    const direct = mode === "direct";
    const current = getCurrentUser();
    const others = members.filter(member => member.name !== current);

    if (direct) {
        const selected = getElement("brainstormDirectSelect")?.value || others[0]?.name;
        if (selected) brainstormActiveRoomKey = brainstormDmRoomKey(current, selected);
    }
    else {
        brainstormActiveRoomKey = "team";
    }

    brainstormReplyTo = null;
    renderBrainstormAll();
    markBrainstormRoomSeen();
}

function selectBrainstormDirectMember(memberName) {
    if (isLecturer() || !memberName || memberName === getCurrentUser()) return;
    brainstormActiveRoomKey = brainstormDmRoomKey(getCurrentUser(), memberName);
    brainstormReplyTo = null;
    renderBrainstormAll();
    markBrainstormRoomSeen();
}

function selectBrainstormRoom(key) {
    if (isLecturer() || !brainstormRoomRegistry[key]) return;
    brainstormActiveRoomKey = key;
    brainstormReplyTo = null;
    renderBrainstormAll();
    markBrainstormRoomSeen();
}

function toggleBrainstormDrawer() {
    if (isLecturer()) return;
    const drawer = getElement("brainstormDrawer");
    if (drawer && drawer.classList.contains("open")) closeBrainstormDrawer();
    else openBrainstormDrawer();
}

function openBrainstormDrawer() {
    if (isLecturer()) return;
    startBrainstormListeners();
    getElement("brainstormDrawer")?.classList.add("open");
    getElement("brainstormDrawerOverlay")?.classList.add("open");
    getElement("brainstormDrawer")?.setAttribute("aria-hidden", "false");
    renderBrainstormAll();
    markBrainstormRoomSeen();
    setTimeout(() => getElement("brainstormMessageInput")?.focus(), 100);
}

function closeBrainstormDrawer() {
    getElement("brainstormDrawer")?.classList.remove("open");
    getElement("brainstormDrawerOverlay")?.classList.remove("open");
    getElement("brainstormDrawer")?.setAttribute("aria-hidden", "true");
}

function openFullBrainstorm() {
    if (isLecturer()) return;
    closeBrainstormDrawer();
    getElement("brainstormFullOverlay")?.classList.add("open");
    getElement("brainstormFullModal")?.classList.add("open");
    getElement("brainstormFullModal")?.setAttribute("aria-hidden", "false");
    renderBrainstormAll();
    markBrainstormRoomSeen();
    setTimeout(() => getElement("brainstormFullMessageInput")?.focus(), 100);
}

function closeFullBrainstorm() {
    getElement("brainstormFullOverlay")?.classList.remove("open");
    getElement("brainstormFullModal")?.classList.remove("open");
    getElement("brainstormFullModal")?.setAttribute("aria-hidden", "true");
}

function brainstormTimeLabel(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function brainstormInitials(name) {
    return String(name || "?")
        .split(/\s+/)
        .filter(Boolean)
        .map(part => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function brainstormReactionLabel(key) {
    return ({ idea: "💡", like: "👍", fire: "🔥" })[key] || "•";
}

function brainstormMessageHtml(message) {
    const current = getCurrentUser();
    const own = message.sender === current;
    const reactions = message.reactions || {};
    const reply = message.replyTo || null;

    const reactionHtml = ["idea", "like", "fire"].map(key => {
        const names = Array.isArray(reactions[key]) ? reactions[key] : [];
        const mine = names.includes(current);
        return `<button type="button" class="brainstorm-react ${mine ? "mine" : ""}" onclick="toggleBrainstormReaction('${message.id}','${key}')">${brainstormReactionLabel(key)}${names.length ? ` ${names.length}` : ""}</button>`;
    }).join("");

    return `
        <div class="brainstorm-msg ${own ? "own" : ""}">
            <div class="brainstorm-avatar">${brainstormSafeHtml(brainstormInitials(message.sender))}</div>
            <div class="brainstorm-bubble-wrap">
                <div class="brainstorm-msg-meta">
                    <span class="brainstorm-msg-name">${brainstormSafeHtml(message.sender || "Unknown")}</span>
                    <span>${brainstormSafeHtml(brainstormTimeLabel(message.createdAt))}</span>
                </div>
                <div class="brainstorm-bubble">
                    ${(message.pinned || message.decision) ? `<div class="brainstorm-badges">${message.pinned ? '<span class="brainstorm-badge pin">📌 PINNED</span>' : ''}${message.decision ? '<span class="brainstorm-badge decision">✓ DECISION</span>' : ''}</div>` : ""}
                    ${reply ? `<div class="brainstorm-reply-quote"><strong>${brainstormSafeHtml(reply.sender || "")}</strong><br>${brainstormSafeHtml(reply.text || "")}</div>` : ""}
                    <div>${brainstormSafeHtml(message.text || "")}</div>
                    <div class="brainstorm-reactions">${reactionHtml}</div>
                </div>
                <div class="brainstorm-msg-actions">
                    <button type="button" class="brainstorm-action" onclick="replyToBrainstormMessage('${message.id}')">↩ Reply</button>
                    <button type="button" class="brainstorm-action" onclick="toggleBrainstormPin('${message.id}')">${message.pinned ? "Unpin" : "📌 Pin"}</button>
                    <button type="button" class="brainstorm-action" onclick="toggleBrainstormDecision('${message.id}')">${message.decision ? "Undo Decision" : "✓ Decision"}</button>
                    <button type="button" class="brainstorm-action" onclick="convertBrainstormToTask('${message.id}')">→ Task</button>
                </div>
            </div>
        </div>`;
}

function renderBrainstormMessagesInto(containerId) {
    const container = getElement(containerId);
    if (!container) return;

    const messages = brainstormMessagesForRoom();
    if (!messages.length) {
        container.innerHTML = `<div class="brainstorm-empty"><div><strong>No messages yet.</strong><br><br>Start with an idea, question, calculation or design decision.</div></div>`;
        return;
    }

    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 110;
    container.innerHTML = messages.map(brainstormMessageHtml).join("");
    if (nearBottom || !container.dataset.rendered) {
        container.scrollTop = container.scrollHeight;
    }
    container.dataset.rendered = "1";
}

function renderBrainstormRoomHeaders() {
    const room = getBrainstormRoom();
    const isDirect = room.type === "direct";

    ["brainstormRoomTitle", "brainstormFullRoomTitle"].forEach(id => {
        const el = getElement(id); if (el) el.textContent = room.title;
    });
    ["brainstormRoomMeta", "brainstormFullRoomMeta"].forEach(id => {
        const el = getElement(id); if (el) el.textContent = room.meta;
    });
    ["brainstormRoomPill", "brainstormFullRoomPill"].forEach(id => {
        const el = getElement(id); if (el) el.textContent = room.pill;
    });

    getElement("brainstormTeamTab")?.classList.toggle("active", !isDirect);
    getElement("brainstormDirectTab")?.classList.toggle("active", isDirect);
    getElement("brainstormDirectPicker")?.classList.toggle("hidden", !isDirect);

    const directSelect = getElement("brainstormDirectSelect");
    if (isDirect && directSelect) directSelect.value = room.title;
}

function renderBrainstormReplyPreviews() {
    const html = brainstormReplyTo
        ? `<span>Replying to <strong>${brainstormSafeHtml(brainstormReplyTo.sender)}</strong>: ${brainstormSafeHtml((brainstormReplyTo.text || "").slice(0, 90))}</span><button type="button" onclick="clearBrainstormReply()">×</button>`
        : "";

    ["brainstormReplyPreview", "brainstormFullReplyPreview"].forEach(id => {
        const el = getElement(id);
        if (!el) return;
        el.innerHTML = html;
        el.classList.toggle("hidden", !brainstormReplyTo);
    });
}

function renderBrainstormFullRoomList() {
    const container = getElement("brainstormFullRoomList");
    if (!container || isLecturer()) return;

    const team = brainstormRoomRegistry.team;
    const directRooms = Object.values(brainstormRoomRegistry).filter(room => room.type === "direct");

    const roomButton = room => {
        const unread = brainstormRoomUnreadCount(room.key);
        return `<button type="button" class="brainstorm-room-btn ${room.key === brainstormActiveRoomKey ? "active" : ""}" onclick="selectBrainstormRoom('${room.key}')"><span>${room.type === "team" ? "👥" : "👤"} ${brainstormSafeHtml(room.title)}</span>${unread ? `<span class="brainstorm-room-count">${unread}</span>` : ""}</button>`;
    };

    container.innerHTML = roomButton(team) +
        `<div class="brainstorm-room-list-title">DIRECT MESSAGES</div>` +
        directRooms.map(roomButton).join("");
}

function renderBrainstormSidePanels() {
    const messages = brainstormMessagesForRoom();
    const pinned = messages.filter(message => message.pinned).slice(-8).reverse();
    const decisions = messages.filter(message => message.decision).slice(-8).reverse();

    const renderItems = (items, empty) => items.length
        ? items.map(message => `<div class="brainstorm-side-item"><strong>${brainstormSafeHtml(message.sender || "")}</strong><br>${brainstormSafeHtml((message.text || "").slice(0, 150))}</div>`).join("")
        : `<div class="brainstorm-side-empty">${empty}</div>`;

    const pinnedEl = getElement("brainstormPinnedList");
    const decisionEl = getElement("brainstormDecisionList");
    if (pinnedEl) pinnedEl.innerHTML = renderItems(pinned, "No pinned ideas yet.");
    if (decisionEl) decisionEl.innerHTML = renderItems(decisions, "No decisions marked yet.");

    const summaryBox = getElement("brainstormAiSummaryBox");
    if (summaryBox && brainstormAiSummaryCache[brainstormActiveRoomKey]) {
        summaryBox.textContent = brainstormAiSummaryCache[brainstormActiveRoomKey];
    }
}

function renderBrainstormAll() {
    if (isLecturer()) return;
    if (!Object.keys(brainstormRoomRegistry).length) buildBrainstormRoomRegistry();
    populateBrainstormDirectPicker();
    renderBrainstormRoomHeaders();
    renderBrainstormMessagesInto("brainstormMessages");
    renderBrainstormMessagesInto("brainstormFullMessages");
    renderBrainstormReplyPreviews();
    renderBrainstormFullRoomList();
    renderBrainstormSidePanels();
}

function brainstormComposerKeydown(event, source) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendBrainstormMessage(source);
    }
}

async function sendBrainstormMessage(source = "drawer") {
    if (isLecturer()) return;
    if (!db) {
        showToast("Brainstorm is not connected to Firebase yet.", "warning");
        return;
    }

    const input = getElement(source === "full" ? "brainstormFullMessageInput" : "brainstormMessageInput");
    const text = sanitizeText(input ? input.value : "");
    if (!text) return;

    const room = getBrainstormRoom();
    const current = getCurrentUser();
    const email = brainstormCurrentEmail();
    if (!room || !current || !email) return;

    try {
        await ensureBrainstormRoom(room);
        await db.collection("brainstormRooms")
            .doc(room.key)
            .collection("messages")
            .add({
                sender: current,
                senderEmail: email,
                text,
                createdAt: new Date().toISOString(),
                pinned: false,
                decision: false,
                reactions: { idea: [], like: [], fire: [] },
                replyTo: brainstormReplyTo ? {
                    id: brainstormReplyTo.id,
                    sender: brainstormReplyTo.sender,
                    text: (brainstormReplyTo.text || "").slice(0, 220)
                } : null
            });

        if (input) input.value = "";
        brainstormReplyTo = null;
        renderBrainstormReplyPreviews();
        markBrainstormRoomSeen(room.key);
    }
    catch (error) {
        console.error("Brainstorm send failed:", error);
        showToast("❌ Message failed to send: " + (error.message || "Unknown error"));
    }
}

function findBrainstormMessage(id) {
    return brainstormMessagesForRoom().find(message => message.id === id) || null;
}

function brainstormMessageRef(id) {
    return db.collection("brainstormRooms")
        .doc(brainstormActiveRoomKey)
        .collection("messages")
        .doc(id);
}

function replyToBrainstormMessage(id) {
    if (isLecturer()) return;
    const message = findBrainstormMessage(id);
    if (!message) return;
    brainstormReplyTo = { id: message.id, sender: message.sender, text: message.text };
    renderBrainstormReplyPreviews();
    const fullOpen = getElement("brainstormFullModal")?.classList.contains("open");
    setTimeout(() => getElement(fullOpen ? "brainstormFullMessageInput" : "brainstormMessageInput")?.focus(), 30);
}

function clearBrainstormReply() {
    brainstormReplyTo = null;
    renderBrainstormReplyPreviews();
}

async function toggleBrainstormReaction(id, reactionKey) {
    if (isLecturer() || !db) return;
    const message = findBrainstormMessage(id);
    if (!message) return;

    const current = getCurrentUser();
    const reactions = { idea: [], like: [], fire: [], ...(message.reactions || {}) };
    const existing = Array.isArray(reactions[reactionKey]) ? [...reactions[reactionKey]] : [];
    reactions[reactionKey] = existing.includes(current)
        ? existing.filter(name => name !== current)
        : [...existing, current];

    try {
        await brainstormMessageRef(id).update({ reactions });
    }
    catch (error) {
        console.error("Brainstorm reaction failed:", error);
    }
}

async function toggleBrainstormPin(id) {
    if (isLecturer() || !db) return;
    const message = findBrainstormMessage(id);
    if (!message) return;
    try {
        await brainstormMessageRef(id).update({ pinned: !message.pinned });
    }
    catch (error) {
        showToast("❌ Pin update failed: " + error.message);
    }
}

async function toggleBrainstormDecision(id) {
    if (isLecturer() || !db) return;
    const message = findBrainstormMessage(id);
    if (!message) return;
    try {
        await brainstormMessageRef(id).update({ decision: !message.decision });
    }
    catch (error) {
        showToast("❌ Decision update failed: " + error.message);
    }
}

function convertBrainstormToTask(id) {
    if (isLecturer()) return;
    const message = findBrainstormMessage(id);
    if (!message) return;

    const excerpt = String(message.text || "").replace(/\s+/g, " ").trim();
    const name = excerpt.length > 82 ? excerpt.slice(0, 79) + "..." : excerpt;

    closeBrainstormDrawer();
    closeFullBrainstorm();
    openTaskModal(null, {
        name: name || "Brainstorm action item",
        mainPIC: getCurrentUser() || ""
    });
    showToast("Brainstorm idea copied into a new task. Add PIC/deadline and save.");
}

function buildLocalBrainstormSummary(messages) {
    const decisions = messages.filter(message => message.decision);
    const pinned = messages.filter(message => message.pinned && !message.decision);
    const recent = messages.slice(-8);

    const lines = [];
    lines.push("Local structured summary (AI backend not connected)");
    lines.push("");

    if (decisions.length) {
        lines.push("Decisions");
        decisions.slice(-5).forEach(message => lines.push("• " + message.text));
        lines.push("");
    }

    if (pinned.length) {
        lines.push("Pinned ideas");
        pinned.slice(-5).forEach(message => lines.push("• " + message.text));
        lines.push("");
    }

    lines.push("Recent discussion");
    recent.slice(-5).forEach(message => lines.push(`• ${message.sender}: ${message.text}`));
    return lines.join("\n");
}

async function generateBrainstormSummary() {
    if (isLecturer()) return;
    const button = getElement("brainstormAiSummaryBtn");
    const box = getElement("brainstormAiSummaryBox");
    const messages = brainstormMessagesForRoom().slice(-60);
    const room = getBrainstormRoom();

    if (!messages.length) {
        if (box) box.textContent = "No messages to summarise yet.";
        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent = "Summarising...";
    }
    if (box) box.textContent = "Reviewing this discussion...";

    try {
        if (!functionsInstance) throw new Error("AI function not available");

        const callable = functionsInstance.httpsCallable("generateBrainstormSummary");
        const result = await callable({
            room: { key: room.key, type: room.type, title: room.title },
            messages: messages.map(message => ({
                sender: message.sender,
                text: message.text,
                pinned: !!message.pinned,
                decision: !!message.decision,
                replyTo: message.replyTo || null
            }))
        });

        const summary = result && result.data && (result.data.summary || result.data.text);
        if (!summary) throw new Error("AI returned no summary");

        brainstormAiSummaryCache[brainstormActiveRoomKey] = String(summary);
        if (box) box.textContent = String(summary);
    }
    catch (error) {
        console.warn("Brainstorm AI summary fallback:", error);
        const fallback = buildLocalBrainstormSummary(messages);
        brainstormAiSummaryCache[brainstormActiveRoomKey] = fallback;
        if (box) box.textContent = fallback;
    }
    finally {
        if (button) {
            button.disabled = false;
            button.textContent = "Summarise";
        }
    }
}


// ============================================================
// DOM READY
// ============================================================

function initApplication() {

    initEmailJS();

    initFirebase();

    if (!firebaseReady) {
        renderLoginScreen();
    }

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initApplication
    );

}

else {

    initApplication();

}


// TEAM PRESENCE — independent tab leases; server timestamps; no activity-history writes.
const teamPresence = {
    records: {}, unsubscribers: [], timer: null, user: null,
    session: null, lastInput: Date.now(), busy: false, failed: false
};
function presenceMillis(value) {
    return value && typeof value.toMillis === 'function' ? value.toMillis() : 0;
}
function presenceState(record, now = Date.now()) {
    if (!record) return 'Not recorded';
    const live = Object.values(record.sessions || {}).filter(s =>
        presenceMillis(s.seen) > now - 120000 && presenceMillis(s.seen) <= now + 120000);
    if (!live.length) return 'Offline';
    return live.some(s => s.active) ? 'Online' : 'Away';
}
function presenceTime(value) {
    const ms = presenceMillis(value);
    if (!ms) return 'Not recorded';
    return new Date(ms).toLocaleString('en-MY', {
        timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short',
        year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) + ' MYT';
}
function presenceEscape(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function presenceRelative(value, now = Date.now()) {
    const ms = presenceMillis(value);
    if (!ms) return 'Not recorded';
    const minutes = Math.floor(Math.max(0, now - ms) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return minutes + ' min ago';
    if (minutes < 1440) return Math.floor(minutes / 60) + ' hr ago';
    if (minutes < 10080) return Math.floor(minutes / 1440) + ' days ago';
    return new Date(ms).toLocaleDateString('en-MY', {timeZone:'Asia/Kuala_Lumpur', day:'numeric', month:'short', year:'numeric'});
}
function presenceMemberHtml(name) {
    const r = teamPresence.records[name];
    const status = teamPresence.failed || !navigator.onLine ? 'Unavailable' : presenceState(r);
    const entry = activityLog.find(item => item.user === name);
    const text = document.createElement('div');
    text.innerHTML = entry ? entry.text : '';
    const activityMs = entry ? Date.parse(entry.time) : NaN;
    const activityTime = Number.isFinite(activityMs) ? {toMillis: () => activityMs} : null;
    const timeLabel = (value) => {
        const full = presenceEscape(presenceTime(value));
        return `<strong title="${full}" aria-label="${full}">${presenceEscape(presenceRelative(value))}</strong>`;
    };
    return `<div class="presence-meta"><span class="presence-status presence-${status.toLowerCase().replaceAll(' ','-')}">${status}</span>
        <div class="presence-time-row"><span>Last seen</span>${timeLabel(r && r.lastSeen)}</div>
        <div class="presence-time-row"><span>Last login</span>${timeLabel(r && r.lastLogin)}</div>
        <div class="presence-activity"><span class="presence-activity-label">LATEST ACTIVITY</span>
        <p class="presence-activity-text" title="${presenceEscape(text.textContent || 'No recorded activity')}">${presenceEscape(text.textContent || 'No recorded activity')}</p>
        <span class="presence-activity-time" title="${presenceEscape(presenceTime(activityTime))}">${activityTime ? presenceEscape(presenceRelative(activityTime)) : '—'}</span></div></div>`;
}
function renderTeamPresence() {
    const allowed = teamPresence.user && members.some(m => m.name === getCurrentUser());
    let trigger = document.getElementById('teamPresenceTrigger');
    if (!trigger) {
        trigger = document.createElement('button');
        trigger.id = 'teamPresenceTrigger'; trigger.type = 'button';
        trigger.className = 'presence-trigger';
        trigger.onclick = () => showSection('team');
        document.querySelector('.header-actions')?.prepend(trigger);
    }
    trigger.hidden = !allowed;
    const online = members.filter(m => presenceState(teamPresence.records[m.name]) === 'Online');
    trigger.textContent = teamPresence.failed || !navigator.onLine ? 'Team status unavailable' : `${online.length} online · Team`;
    trigger.title = online.length ? online.map(m => m.name).join(', ') : 'View team status';
    document.querySelectorAll('#teamList .team-card').forEach(card => {
        let box = card.querySelector('.presence-slot');
        if (!box) { box = document.createElement('div'); box.className='presence-slot'; card.querySelector('.team-member-heading')?.after(box); }
        box.hidden = !allowed;
        const name = card.querySelector('h3')?.textContent;
        box.innerHTML = allowed ? presenceMemberHtml(name) : '';
    });
    let summary = document.getElementById('leaderPresence');
    if (!summary) {
        summary = document.createElement('div'); summary.id='leaderPresence'; summary.className='presence-summary';
        document.getElementById('leaderhub')?.append(summary);
    }
    summary.hidden = !allowed || !isGroupLeader();
    if (!summary.hidden) summary.innerHTML = `<h3>Team presence</h3><p>Status reflects dashboard connection, not work contribution. Times in Malaysia.</p><div class="presence-grid">${members.map(m => `<article><strong>${presenceEscape(m.name)}</strong>${presenceMemberHtml(m.name)}</article>`).join('')}</div>`;
}
async function writeTeamPresence() {
    if (!teamPresence.user || teamPresence.busy || !navigator.onLine) return;
    teamPresence.busy = true;
    const user = teamPresence.user, session = teamPresence.session;
    try {
        const account = getAccountByEmail(user.email);
        const ref = db.collection('trackerData').doc('presence_' + account.name);
        const stamp = firebase.firestore.FieldValue.serverTimestamp;
        const payload = {lastSeen: stamp(), sessions: {[session]: {
            seen: stamp(), active: !document.hidden && Date.now() - teamPresence.lastInput < 300000
        }}};
        // Firebase's authentication time remains unchanged on a page refresh.
        const login = Date.parse(user.metadata.lastSignInTime);
        const previous = presenceMillis(teamPresence.records[account.name]?.lastLogin);
        if (Number.isFinite(login) && login > previous) payload.lastLogin = firebase.firestore.Timestamp.fromMillis(login);
        const stale = Object.entries(teamPresence.records[account.name]?.sessions || {}).filter(([key,s]) => key !== session && presenceMillis(s.seen) < Date.now()-86400000);
        for (const [key] of stale) payload.sessions[key] = firebase.firestore.FieldValue.delete();
        if (payload.lastLogin) {
            await db.runTransaction(async transaction => {
                const current = await transaction.get(ref);
                const savedLogin = current.exists && current.data().lastLogin;
                if (presenceMillis(savedLogin) > login) payload.lastLogin = savedLogin;
                transaction.set(ref, payload, {merge:true});
            });
        } else {
            await ref.set(payload, {merge:true});
        }
        teamPresence.failed = false;
    } catch (error) {
        teamPresence.failed = true;
        console.warn('Team presence unavailable:', error.code);
    } finally { teamPresence.busy = false; renderTeamPresence(); }
}
function stopTeamPresence() {
    clearInterval(teamPresence.timer);
    teamPresence.unsubscribers.forEach(fn => fn());
    teamPresence.unsubscribers=[]; teamPresence.user=null; teamPresence.records={};
    renderTeamPresence();
}
function startTeamPresence(user) {
    stopTeamPresence();
    const account = user && getAccountByEmail(user.email);
    if (!account || !members.some(m => m.name === account.name)) return;
    teamPresence.user=user; teamPresence.session=crypto.randomUUID();
    teamPresence.lastInput=Date.now(); teamPresence.failed=false;
    members.forEach(m => {
        teamPresence.unsubscribers.push(db.collection('trackerData').doc('presence_' + m.name).onSnapshot({includeMetadataChanges:true}, snap => {
            // Cached leases cannot prove someone is currently connected.
            teamPresence.records[m.name] = snap.exists && !snap.metadata.fromCache ? snap.data() : undefined;
            renderTeamPresence();
        }, () => { teamPresence.failed=true; renderTeamPresence(); }));
    });
    writeTeamPresence();
    teamPresence.timer=setInterval(() => {writeTeamPresence(); renderTeamPresence();}, 30000);
}
// A lease expires within two minutes even if a browser crashes or loses its connection.
// Explicit sign-out clears this tab first; other tabs retain their own independent leases.
async function releaseTeamPresence() {
    if (!teamPresence.user) return;
    const name = getAccountByEmail(teamPresence.user.email)?.name;
    const session = teamPresence.session;
    const ref = db.collection('trackerData').doc('presence_' + name);
    stopTeamPresence();
    try { await Promise.race([
        ref.set({sessions:{[session]:firebase.firestore.FieldValue.delete()}}, {merge:true}),
        new Promise(resolve => setTimeout(resolve, 1500))
    ]); } catch (_) { /* Expiry handles a lost connection. */ }
}
['pointerdown','pointermove','keydown','scroll','touchstart'].forEach(event => document.addEventListener(event, () => {teamPresence.lastInput=Date.now();}, {passive:true}));
document.addEventListener('visibilitychange', () => {if (!document.hidden) teamPresence.lastInput=Date.now(); writeTeamPresence();});
window.addEventListener('online', writeTeamPresence);
window.addEventListener('offline', renderTeamPresence);
const presenceStyle=document.createElement('style');
presenceStyle.textContent=`.presence-trigger{border:1px solid #dce5ed;background:#fff;color:#334155;border-radius:22px;padding:10px 14px;font:inherit;font-size:12px;cursor:pointer}.presence-meta{margin:12px 0;font-size:11px;line-height:1.7;color:#64748b}.presence-meta strong{font-weight:500;color:#334155}.presence-meta p{margin:8px 0 0;overflow-wrap:anywhere}.presence-status{display:inline-block;border-radius:20px;background:#f1f5f9;color:#64748b;padding:2px 9px;margin-bottom:7px;font-weight:700}.presence-online{background:#e8f8ee;color:#168447}.presence-away{background:#fff5db;color:#9a6700}.presence-summary{background:#fff;padding:22px;border:1px solid #e2e8f0;border-radius:16px;margin-top:20px}.presence-summary>p{font-size:12px;color:#64748b}.presence-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.presence-grid article{padding:14px;border:1px solid #e2e8f0;border-radius:12px}.presence-trigger[hidden],.presence-slot[hidden],.presence-summary[hidden]{display:none!important}`;
presenceStyle.textContent += "\n#team .team-card{display:grid;grid-template-rows:70px auto auto auto 36px;align-content:start;row-gap:0}\n#team .team-member-heading{align-self:start;min-width:0}\n#team .team-member-progress{margin:18px 0!important}\n#team .team-member-actions{margin:0!important}\n#team .change-photo-btn{grid-row:5;align-self:end}\n.presence-meta{margin:10px 0 0;font-size:12px;line-height:1.5}\n.presence-time-row{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:6px 0}\n.presence-time-row>span{flex-shrink:0}\n.presence-time-row strong{font-size:12px!important;white-space:nowrap;font-weight:600}\n.presence-status{font-size:11px;margin-bottom:8px}\n.presence-activity{margin-top:14px;border-top:1px solid #edf0f5;padding-top:12px}\n.presence-activity-label{font-size:9px;font-weight:700;letter-spacing:.08em;color:#94a3b8}\n#team .presence-meta .presence-activity-text,.presence-meta .presence-activity-text{font-size:12px;line-height:1.5;margin:5px 0 4px;height:3em;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;color:#536174}\n.presence-activity-time{display:block;font-size:10px;color:#94a3b8}\n";
document.head.append(presenceStyle);
