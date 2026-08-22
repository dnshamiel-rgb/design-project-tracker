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


let db = null;

let storage = null;

let auth = null;

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

                updateDashboard();

                renderTasks();

                renderTeam();

                renderCalendar();

                renderKanban();

                renderMyDay();

                checkEmailReminders();

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
            "tasks"
        )
        .set({
            list: tasks
        })
        .catch(
            error => {

                console.error(
                    "Save tasks failed:",
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

    submissionDeadlineLabel: ""

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

                        submissionDeadlineLabel: sanitizeText(data.submissionDeadlineLabel || "")

                    };

                }

                renderMaintenanceOverlay();

                renderAnnouncementBanner();

                renderSubmissionCountdown();

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

        submissionDeadlineLabel: systemSettings.submissionDeadlineLabel || ""

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

    renderSubmissionCountdown();

    renderNeedsNudge();

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
// PROGRESS HISTORY (for Progress Over Time chart)
// ============================================================
//
// One snapshot per day: { date: "YYYY-MM-DD", overall: number }
// Recorded automatically whenever the dashboard updates, but
// only once per day (today's entry gets overwritten, not
// duplicated, so refreshing many times a day is fine).
// ============================================================

let progressHistory = [];


function listenToProgressHistory() {

    if (!db) return;

    db.collection("trackerData")
        .doc("progressHistory")
        .onSnapshot(
            doc => {

                progressHistory = doc.exists
                    ? (sanitizeStoredData(doc.data().list) || [])
                    : [];

                renderProgressChart();

            },
            error => {

                console.error(
                    "Progress history sync error:",
                    error
                );

            }
        );

}


function saveProgressHistoryData() {

    if (!db) return;

    db.collection("trackerData")
        .doc("progressHistory")
        .set({
            list: progressHistory
        })
        .catch(error => {

            console.error(
                "Save progress history failed:",
                error
            );

        });

}


function recordProgressSnapshot(overall) {

    if (!db) return;

    const today = formatDate(new Date());

    const existingIndex =
        progressHistory.findIndex(
            entry => entry.date === today
        );

    if (existingIndex !== -1) {

        if (progressHistory[existingIndex].overall === overall) {
            return;
        }

        progressHistory[existingIndex].overall = overall;

    }

    else {

        progressHistory.push({
            date: today,
            overall: overall
        });

    }

    progressHistory.sort(
        (a, b) => a.date.localeCompare(b.date)
    );

    saveProgressHistoryData();

}


let progressChartInstance = null;


function renderProgressChart() {

    const canvas = getElement("progressChartCanvas");

    if (!canvas || typeof Chart === "undefined") return;

    const sorted =
        [...progressHistory].sort(
            (a, b) => a.date.localeCompare(b.date)
        );

    const labels = sorted.map(entry => entry.date);

    const data = sorted.map(entry => entry.overall);

    if (progressChartInstance) {

        progressChartInstance.data.labels = labels;

        progressChartInstance.data.datasets[0].data = data;

        progressChartInstance.update();

        return;

    }

    progressChartInstance = new Chart(canvas, {

        type: "line",

        data: {

            labels: labels,

            datasets: [{
                label: "Overall Progress (%)",
                data: data,
                borderColor: "#6875ed",
                backgroundColor: "rgba(104,117,237,0.1)",
                fill: true,
                tension: 0.3,
                pointBackgroundColor: "#6875ed"
            }]

        },

        options: {

            responsive: true,

            scales: {
                y: {
                    min: 0,
                    max: 100,
                    ticks: {
                        callback: value => value + "%"
                    }
                }
            },

            plugins: {
                legend: {
                    display: false
                }
            }

        }

    });

}


// ============================================================
// MY DAY (landing page after login)
// ============================================================

function renderMyDay() {

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

    let html = "";

    html += `<div class="myday-section-title">🔴 DUE TODAY / OVERDUE</div>`;

    html +=
        dueTasks.length === 0
            ? `<div class="myday-empty">Nothing overdue. 🎉</div>`
            : dueTasks.map(task => renderMydayTaskItem(task)).join("");

    html += `<div class="myday-section-title">🟠 DUE SOON (NEXT 3 DAYS)</div>`;

    html +=
        upcomingTasks.length === 0
            ? `<div class="myday-empty">Nothing due soon.</div>`
            : upcomingTasks.map(task => renderMydayTaskItem(task)).join("");

    html += `<div class="myday-section-title">🗓️ TODAY'S MEETINGS</div>`;

    html +=
        todaysMeetings.length === 0
            ? `<div class="myday-empty">No meetings today.</div>`
            : todaysMeetings
                .map(
                    meeting => `
                        <div class="myday-item" onclick="editMeeting(${meeting.id})">
                            <div>
                                <div class="myday-item-title">📌 ${meeting.title}</div>
                                <div class="myday-item-sub">
                                    ${meeting.time || "No time set"}
                                    ${meeting.location ? " · " + meeting.location : ""}
                                </div>
                            </div>
                        </div>
                    `
                )
                .join("");

    container.innerHTML = html;

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

                }

                else {

                    resources = [];

                }

                renderChapters();

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
            list: resources
        })
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

    CHAPTERS.forEach(
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
            CHAPTERS[0]
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

    const resourceData = {

        chapter:
            getElement(
                "resourceChapter"
            ).value,

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


function toggleChapter(
    chapterName
) {

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

    container.innerHTML = "";

    CHAPTERS.forEach(
        (chapter, index) => {

            const chapterResources =
                resources.filter(
                    item =>
                        item.chapter === chapter
                );

            const isOpen =
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

                    <div class="chapter-chevron">
                        ▶
                    </div>

                </div>

                <div class="chapter-body">
                    ${itemsHtml}
                </div>

            `;

            container.appendChild(
                card
            );

        }
    );

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
// OPEN / CLOSE MEETING MODAL
// ============================================================

function openMeetingModal(
    meeting = null
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

        renderMeetingAttendeeCheckboxes();

    }

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

    const meetingData = {

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

        attendees:
            attendees,

        attended:
            oldMeeting
                ? oldMeeting.attended || []
                : []

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

    const container =
        getElement(
            "meetingList"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        meetings.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🗓️</div>
                <div class="empty-state-title">No meetings yet</div>
                <div class="empty-state-text">Schedule your first team sync to keep everyone on the same page.</div>
                ${!isLecturer() ? `<button class="small-add" onclick="openMeetingModal()">+ Add Meeting</button>` : ""}
            </div>
        `;

        return;

    }

    const sorted =
        [...meetings].sort(
            (a, b) =>
                `${a.date}T${a.time || "00:00"}`.localeCompare(
                    `${b.date}T${b.time || "00:00"}`
                )
        );

    sorted.forEach(
        meeting => {

            const status =
                getMeetingStatus(
                    meeting
                );

            const attendees =
                meeting.attendees || [];

            const attended =
                meeting.attended || [];

            container.innerHTML += `

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

                    <div class="meeting-attendees">

                        <div class="meeting-attendees-label">
                            👥 Attendance
                            (${attended.length}/${attendees.length})
                        </div>

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

                    </div>

                    ${
                        meeting.mom && meeting.mom.summary
                            ? `<div class="mom-badge">📝 Minutes recorded</div>`
                            : ""
                    }

                    <div class="meeting-actions">

                        <button
                            class="edit-btn"
                            onclick="openMomModal(${meeting.id})"
                        >
                            📝 ${meeting.mom && meeting.mom.summary ? "Minutes" : "Add Minutes"}
                        </button>

                        <button
                            class="edit-btn"
                            onclick="editMeeting(${meeting.id})"
                        >
                            Edit
                        </button>

                        <button
                            class="delete-btn"
                            onclick="deleteMeeting(${meeting.id})"
                        >
                            Delete
                        </button>

                    </div>

                </div>

            `;

        }
    );

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

    select.innerHTML = `<option value="">No owner</option>`;

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

        doc.setFillColor(...dark);

        doc.rect(margin, y, contentWidth, 8, "F");

        doc.setTextColor(255, 255, 255);

        doc.setFontSize(8);

        doc.setFont(undefined, "bold");

        doc.text("ACTION ITEM", margin + 3, y + 5.5);

        doc.text("OWNER", margin + 130, y + 5.5);

        doc.text("STATUS", margin + contentWidth - 3, y + 5.5, { align: "right" });

        y += 8;

        currentMomActionItems.forEach((item, index) => {

            y = checkPageBreak(11, y);

            const rowH = 11;

            if (index % 2 === 0) {

                doc.setFillColor(249, 250, 252);

                doc.rect(margin, y, contentWidth, rowH, "F");

            }

            doc.setTextColor(...dark);

            doc.setFontSize(8.5);

            doc.setFont(undefined, "normal");

            const shortText =
                item.text.length > 58 ? item.text.slice(0, 56) + "…" : item.text;

            doc.text(shortText, margin + 3, y + 7);

            doc.setTextColor(...muted);

            doc.text(item.owner || "-", margin + 130, y + 7);

            doc.setTextColor(item.done ? 34 : 217, item.done ? 197 : 119, item.done ? 94 : 6);

            doc.setFont(undefined, "bold");

            doc.text(item.done ? "DONE" : "PENDING", margin + contentWidth - 3, y + 7, { align: "right" });

            y += rowH;

        });

        doc.setDrawColor(...border);

        doc.line(margin, y, margin + contentWidth, y);

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


    doc.save(`${meeting.title.replace(/[^a-zA-Z0-9]/g, "_")}_Minutes.pdf`);

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

    const saveBtn = getElement("taskMarkingSaveBtn");

    if (saveBtn) {

        saveBtn.style.display = isLecturer() ? "" : "none";

    }

    if (statusEl) statusEl.disabled = !isLecturer();

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
    listenToProgressHistory();
    listenToMemberPhotos();
    listenToNotifications();
    listenToDeleteRequests();
    listenToSystemSettings();

    if (isGroupLeader()) {

        listenToLeaderNotes();

    }

}


function handleAuthStateChanged(firebaseUser) {

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


    recordProgressSnapshot(overall);


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

function updateAttention() {

    const container =
        getElement(
            "attentionList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const urgent =
        tasks.filter(
            task =>
                task.status !== "Done" &&
                getDaysLeft(
                    task.deadline
                ) <= 3
        );


    if (
        urgent.length === 0
    ) {

        container.innerHTML =
            "<p>🎉 No urgent deadlines!</p>";

        return;

    }


    urgent.forEach(
        task => {


            const deadline =
                getDeadlineStatus(
                    task
                );


            const icon =
                deadline.type === "overdue"
                    ? "🔴"
                    : deadline.type === "urgent"
                        ? "🚨"
                        : "🟠";


            const assigned =
                task.assigned || [];


            container.innerHTML += `

                <div class="attention">

                    <strong>

                        ${icon}

                        ${task.name}

                    </strong>


                    <small>

                        Main PIC:
                        ${task.mainPIC}

                        · Assigned:
                        ${assigned.join(", ")}

                        · ${deadline.text}

                    </small>

                </div>

            `;

        }
    );

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
                                class="open-link"
                                href="${task.fileUrl}"
                                target="_blank"
                                rel="noopener"
                            >
                                📄 ${task.fileName}
                            </a>
                        `
                        : `
                            <br>
                            <small>
                                📄 ${task.fileName} (no file uploaded)
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

                    <td>

                        <strong>
                            ${task.name}
                        </strong>

                        ${getLecturerMarkingBadge(task)}

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


                    <td>

                        <span class="pic-tag">

                            ${task.mainPIC || "-"}

                        </span>

                    </td>


                    <td>

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


                    <td>
                        ${task.priority || "-"}
                    </td>


                    <td>

                        <span
                            class="
                                badge
                                ${statusClass}
                            "
                        >

                            ${task.status}

                        </span>

                    </td>


                    <td>

                        ${Number(
                            task.progress || 0
                        )}%

                    </td>


                    <td>

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


                    <td>

                        ${attachment}

                    </td>


                    <td>

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

                                    <button
                                        class="delete-btn"
                                        onclick="deleteTask(${task.id})"
                                    >
                                        Delete
                                    </button>
                                `
                        }

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

                <div
                    class="team-card"
                    onclick="openMemberProfile('${member.name}')"
                    style="cursor:pointer"
                >

                    <div class="avatar">

                        ${getAvatarHtml(member.name)}

                    </div>


                    <h3>

                        ${member.name}
                        ${member.name === LEADER_NAME ? '<span class="leader-badge" title="Group Leader">👑</span>' : ""}

                    </h3>


                    <p>

                        ${member.name === LEADER_NAME ? "Group Leader" : "Team Member"}

                    </p>


                    <p>

                        ${memberTasks.length}
                        task(s)

                    </p>


                    <strong>

                        ${progress}% Progress

                    </strong>


                    <br><br>


                    <button
                        type="button"
                        onclick="
                            event.stopPropagation();
                            openMemberProfile('${member.name}');
                        "
                    >

                        View Profile

                    </button>

                    ${
                        isGroupLeader()
                            ? `
                                <button
                                    type="button"
                                    onclick="
                                        event.stopPropagation();
                                        generateContributionReport('${member.name}');
                                    "
                                >
                                    📄 Report
                                </button>
                            `
                            : ""
                    }

                    ${
                        getCurrentUser() === member.name
                            ? `
                                <label
                                    class="change-photo-btn"
                                    onclick="event.stopPropagation();"
                                >
                                    📷 Change Photo
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onclick="event.stopPropagation();"
                                        onchange="changeMyPhoto(event)"
                                        hidden
                                    >
                                </label>
                            `
                            : ""
                    }

                </div>

            `;

        }
    );

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

    let attachmentsHtml = "";

    if (task.attachment) {

        attachmentsHtml +=
            `<a class="open-link" href="${task.attachment}" target="_blank" rel="noopener">🔗 Open Link</a>`;

    }

    if (task.fileName) {

        attachmentsHtml +=
            task.fileUrl
                ? `<a class="lecturer-card-file" href="${task.fileUrl}" target="_blank" rel="noopener">📄 ${task.fileName}</a>`
                : `<span class="lecturer-card-file">📄 ${task.fileName} (no file uploaded)</span>`;

    }

    if (Array.isArray(task.links) && task.links.length > 0) {

        attachmentsHtml +=
            task.links
                .map(link =>
                    `<a class="open-link" href="${link.url}" target="_blank" rel="noopener">🔗 ${link.label || "Link"}</a>`
                )
                .join("");

    }

    if (!attachmentsHtml) {

        attachmentsHtml =
            `<span class="lecturer-card-no-attachment">⚠️ No attachment or link provided</span>`;

    }

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

            <div class="lecturer-card-progress-bar">
                <div style="width:${task.progress || 0}%"></div>
            </div>

            <span class="lecturer-card-progress-text">${task.progress || 0}%</span>

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


        const currentFile =
            getElement(
                "currentFile"
            );


        if (currentFile) {

            if (task.fileName && task.fileUrl) {

                currentFile.innerHTML =
                    `Current file: <a href="${task.fileUrl}" target="_blank" rel="noopener">${task.fileName}</a>`;

            }

            else if (task.fileName) {

                currentFile.textContent =
                    "Current file: " + task.fileName + " (no file uploaded — please re-attach)";

            }

            else {

                currentFile.textContent = "";

            }

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

async function saveTask(event) {

    event.preventDefault();

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


        if (
            index !== -1
        ) {

            tasks[index] = {

                id:
                    Number(id),

                ...taskData

            };

        }

    }

    else {

        const newTaskId = Date.now();

        tasks.push({

            id:
                newTaskId,

            ...taskData

        });


        if (pendingMomConversion) {

            linkMomConversionToTask(newTaskId, taskData.name);

        }

    }


    saveData();

    logActivity(
        (id ? "updated task " : "created task ") +
        `"${taskData.name}"`
    );


    updateDashboard();

    renderTasks();

    renderTeam();

    renderCalendar();

    renderKanban();


    closeTaskModal();


    showToast(
        "Task saved successfully!"
    );

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

function renderCalendar() {

    const grid =
        getElement(
            "calendarGrid"
        );


    const title =
        getElement(
            "calendarMonth"
        );


    if (
        !grid ||
        !title
    ) {

        return;

    }


    const year =
        calendarDate.getFullYear();


    const month =
        calendarDate.getMonth();


    const names = [

        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"

    ];


    title.textContent =
        `${names[month]} ${year}`;


    grid.innerHTML = "";


    const first =
        new Date(
            year,
            month,
            1
        );


    const last =
        new Date(
            year,
            month + 1,
            0
        );


    let start =
        first.getDay();


    start =
        start === 0
            ? 6
            : start - 1;


    const days =
        last.getDate();


    const total =
        Math.ceil(
            (
                start +
                days
            ) / 7
        ) * 7;


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    for (
        let i = 0;
        i < total;
        i++
    ) {


        let cellDate;

        let number;


        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "calendar-day";


        if (
            i < start
        ) {

            number =
                new Date(
                    year,
                    month,
                    0
                ).getDate()
                -
                start +
                i +
                1;


            cellDate =
                new Date(
                    year,
                    month - 1,
                    number
                );


            cell.classList.add(
                "other-month"
            );

        }

        else if (
            i <
            start +
            days
        ) {

            number =
                i -
                start +
                1;


            cellDate =
                new Date(
                    year,
                    month,
                    number
                );

        }

        else {

            number =
                i -
                (
                    start +
                    days
                ) +
                1;


            cellDate =
                new Date(
                    year,
                    month + 1,
                    number
                );


            cell.classList.add(
                "other-month"
            );

        }


        const numberElement =
            document.createElement(
                "div"
            );


        numberElement.className =
            "calendar-number";


        numberElement.textContent =
            number;


        cell.appendChild(
            numberElement
        );


        if (
            cellDate.getTime() ===
            today.getTime()
        ) {

            cell.classList.add(
                "today"
            );

        }


        const dateString =
            formatDate(
                cellDate
            );


        tasks
            .filter(
                task =>
                    task.deadline ===
                    dateString
            )
            .forEach(
                task => {


                    const item =
                        document.createElement(
                            "div"
                        );


                    const deadline =
                        getDeadlineStatus(
                            task
                        );


                    item.className =
                        "calendar-task " +
                        calendarClass(
                            deadline.type
                        );


                    item.innerHTML = `

                        <strong>
                            ${task.name}
                        </strong>

                        <small>
                            ${task.mainPIC}
                        </small>

                    `;


                    item.onclick =
                        () =>
                            editTask(
                                task.id
                            );


                    cell.appendChild(
                        item
                    );

                }
            );


        meetings
            .filter(
                meeting =>
                    meeting.date ===
                    dateString
            )
            .forEach(
                meeting => {


                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "calendar-task calendar-meeting";


                    item.innerHTML = `

                        <strong>
                            🗓️ ${meeting.title}
                        </strong>

                        <small>
                            ${meeting.time || "No time set"}
                        </small>

                    `;


                    item.onclick =
                        () =>
                            editMeeting(
                                meeting.id
                            );


                    cell.appendChild(
                        item
                    );

                }
            );


        grid.appendChild(
            cell
        );

    }

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
        days < 0 ||
        days > 3
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

function getReminderLog() {

    return JSON.parse(
        localStorage.getItem(
            "designProjectEmailReminderLog"
        )
    ) || {};

}


function saveReminderLog(
    log
) {

    localStorage.setItem(
        "designProjectEmailReminderLog",
        JSON.stringify(
            log
        )
    );

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


    const log =
        getReminderLog();


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
                days < 0 ||
                days > 3
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
                        log[key]
                    ) {

                        return;

                    }


                    log[key] =
                        true;


                    saveReminderLog(
                        log
                    );


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


function confirmLogout() {

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
// Auto logout selepas 5 minit tiada aktiviti (mouse, keyboard,
// klik, scroll). Berguna untuk komputer awam / kongsi.
// ============================================================

const AUTO_LOGOUT_MINUTES = 5;

let inactivityTimer = null;


function resetInactivityTimer() {

    if (
        inactivityTimer
    ) {

        clearTimeout(
            inactivityTimer
        );

    }

    inactivityTimer =
        setTimeout(
            () => {

                if (
                    getCurrentUser()
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
        "navTeam",
        "navActivity"
    ];

    hiddenNavIds.forEach(id => {

        const el = getElement(id);

        if (el) {

            el.style.display = lecturer ? "none" : "";

        }

    });

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

    setupSearchEvents();

    setupStatusProgressSync();

    setupSubtaskEvents();

    setupLinkEvents();

    setupTaskCommentEvents();

    setupResourceCommentEvents();

    setupMomEvents();

    updateDashboard();

    renderTasks();

    renderTeam();

    renderCalendar();

    renderMeetings();

    renderChapters();

    renderMyDay();

    setupAutoLogout();

    if (isLecturer()) {

        showSection("dashboard");

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
