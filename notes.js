const STORAGE_KEY = "cosmic-notes";
const EXPORT_VERSION = 1;

const notesBoard = document.getElementById("notesBoard");
const addNoteBtn = document.getElementById("addNoteBtn");
const importBtn = document.getElementById("importBtn");
const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");

let notes = [];
let dragState = null;
let resizeState = null;
let zIndexCounter = 1;

const MIN_NOTE_WIDTH = 160;
const MIN_NOTE_HEIGHT = 120;

function createId() {
  return crypto.randomUUID();
}

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return normalizeNotes(data);
  } catch {
    return [];
  }
}

function saveNotes() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: EXPORT_VERSION, notes })
  );
}

function normalizeNotes(data) {
  const list = Array.isArray(data) ? data : data?.notes;
  if (!Array.isArray(list)) return [];

  return list
    .filter((note) => note && typeof note === "object")
    .map((note) => ({
      id: typeof note.id === "string" ? note.id : createId(),
      x: Number.isFinite(note.x) ? note.x : 80,
      y: Number.isFinite(note.y) ? note.y : 80,
      title: typeof note.title === "string" ? note.title : "",
      content: typeof note.content === "string" ? note.content : "",
      width: Number.isFinite(note.width) ? note.width : 220,
      height: Number.isFinite(note.height) ? note.height : 180,
    }));
}

function exportData() {
  return { version: EXPORT_VERSION, notes };
}

function getBoardCenter() {
  const rect = notesBoard.getBoundingClientRect();
  return {
    x: Math.max(24, rect.width / 2 - 110),
    y: Math.max(24, rect.height / 2 - 90),
  };
}

function addNote(partial = {}) {
  const center = getBoardCenter();
  const offset = notes.length * 24;

  const note = {
    id: createId(),
    x: partial.x ?? center.x + offset,
    y: partial.y ?? center.y + offset,
    title: partial.title ?? "",
    content: partial.content ?? "",
    width: partial.width ?? 220,
    height: partial.height ?? 180,
  };

  notes.push(note);
  saveNotes();
  renderNote(note);
  bringToFront(note.id);

  const noteEl = notesBoard.querySelector(`[data-note-id="${note.id}"]`);
  const titleInput = noteEl?.querySelector(".note-title");
  titleInput?.focus();
}

function deleteNote(id) {
  notes = notes.filter((note) => note.id !== id);
  saveNotes();
  notesBoard.querySelector(`[data-note-id="${id}"]`)?.remove();
}

function updateNote(id, changes) {
  const note = notes.find((item) => item.id === id);
  if (!note) return;
  Object.assign(note, changes);
  saveNotes();
}

function bringToFront(id) {
  zIndexCounter += 1;
  const noteEl = notesBoard.querySelector(`[data-note-id="${id}"]`);
  if (noteEl) noteEl.style.zIndex = String(zIndexCounter);
}

function renderNote(note) {
  const el = document.createElement("article");
  el.className = "note";
  el.dataset.noteId = note.id;
  el.style.left = `${note.x}px`;
  el.style.top = `${note.y}px`;
  el.style.width = `${note.width}px`;
  el.style.height = `${note.height}px`;
  el.style.zIndex = String(++zIndexCounter);

  el.innerHTML = `
    <header class="note-header">
      <span class="note-drag-handle" aria-hidden="true">⋮⋮</span>
      <input class="note-title" type="text" placeholder="Untitled" value="${escapeHtml(note.title)}" aria-label="Note title">
      <button class="note-delete" type="button" aria-label="Delete note">×</button>
    </header>
    <textarea class="note-content" placeholder="Write something..." aria-label="Note content">${escapeHtml(note.content)}</textarea>
    <div class="note-resize-handle" aria-hidden="true"></div>
  `;

  const titleInput = el.querySelector(".note-title");
  const contentInput = el.querySelector(".note-content");
  const deleteBtn = el.querySelector(".note-delete");
  const header = el.querySelector(".note-header");
  const resizeHandle = el.querySelector(".note-resize-handle");

  titleInput.addEventListener("input", () => {
    updateNote(note.id, { title: titleInput.value });
  });

  contentInput.addEventListener("input", () => {
    updateNote(note.id, { content: contentInput.value });
  });

  deleteBtn.addEventListener("click", () => deleteNote(note.id));

  header.addEventListener("mousedown", (event) => {
    if (event.target.closest(".note-delete, .note-title")) return;
    startDrag(event, note.id, el);
  });

  resizeHandle.addEventListener("mousedown", (event) => {
    startResize(event, note.id, el);
  });

  el.addEventListener("mousedown", () => bringToFront(note.id));

  notesBoard.appendChild(el);
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function startDrag(event, id, el) {
  event.preventDefault();
  bringToFront(id);

  const note = notes.find((item) => item.id === id);
  if (!note) return;

  const boardRect = notesBoard.getBoundingClientRect();

  dragState = {
    id,
    el,
    offsetX: event.clientX - boardRect.left - note.x,
    offsetY: event.clientY - boardRect.top - note.y,
  };

  el.classList.add("note--dragging");
}

function startResize(event, id, el) {
  event.preventDefault();
  event.stopPropagation();
  bringToFront(id);

  const note = notes.find((item) => item.id === id);
  if (!note) return;

  resizeState = {
    id,
    el,
    startX: event.clientX,
    startY: event.clientY,
    startWidth: note.width,
    startHeight: note.height,
  };

  el.classList.add("note--resizing");
}

function onPointerMove(event) {
  if (dragState) onDragMove(event);
  if (resizeState) onResizeMove(event);
}

function onDragMove(event) {
  if (!dragState) return;

  const boardRect = notesBoard.getBoundingClientRect();
  const noteWidth = dragState.el.offsetWidth;
  const noteHeight = dragState.el.offsetHeight;

  let x = event.clientX - boardRect.left - dragState.offsetX;
  let y = event.clientY - boardRect.top - dragState.offsetY;

  x = Math.max(0, Math.min(x, boardRect.width - noteWidth));
  y = Math.max(0, Math.min(y, boardRect.height - noteHeight));

  dragState.el.style.left = `${x}px`;
  dragState.el.style.top = `${y}px`;
  updateNote(dragState.id, { x, y });
}

function onPointerEnd() {
  if (dragState) {
    dragState.el.classList.remove("note--dragging");
    dragState = null;
  }
  if (resizeState) {
    resizeState.el.classList.remove("note--resizing");
    resizeState = null;
  }
}

function onResizeMove(event) {
  const boardRect = notesBoard.getBoundingClientRect();
  const note = notes.find((item) => item.id === resizeState.id);
  if (!note) return;

  const deltaX = event.clientX - resizeState.startX;
  const deltaY = event.clientY - resizeState.startY;

  let width = resizeState.startWidth + deltaX;
  let height = resizeState.startHeight + deltaY;

  width = Math.max(MIN_NOTE_WIDTH, width);
  height = Math.max(MIN_NOTE_HEIGHT, height);
  width = Math.min(width, boardRect.width - note.x);
  height = Math.min(height, boardRect.height - note.y);

  resizeState.el.style.width = `${width}px`;
  resizeState.el.style.height = `${height}px`;
  updateNote(resizeState.id, { width, height });
}

function renderAllNotes() {
  notesBoard.innerHTML = "";
  for (const note of notes) {
    renderNote(note);
  }
}

function exportNotes() {
  const blob = new Blob([JSON.stringify(exportData(), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cosmic-notes.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importNotesFromFile(file) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      notes = normalizeNotes(data);
      saveNotes();
      renderAllNotes();
    } catch {
      window.alert("Could not import file. Please choose a valid cosmic-notes JSON file.");
    }
  };

  reader.readAsText(file);
}

addNoteBtn.addEventListener("click", () => addNote());
exportBtn.addEventListener("click", exportNotes);
importBtn.addEventListener("click", () => importInput.click());
importInput.addEventListener("change", () => {
  const file = importInput.files?.[0];
  if (file) importNotesFromFile(file);
  importInput.value = "";
});

document.addEventListener("mousemove", onPointerMove);
document.addEventListener("mouseup", onPointerEnd);

notes = loadNotes();
renderAllNotes();

if (notes.length === 0) {
  addNote({ title: "Welcome", content: "Drag me anywhere. Edit this text or add more notes." });
}
