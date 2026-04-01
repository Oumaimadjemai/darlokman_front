import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  Palette,
  AlertCircle,
  CheckCircle,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import axios from "../../api/axiosInstance";
import { HexColorPicker } from "react-colorful";

export default function NoteBoard() {
  const [notes, setNotes] = useState([]);
  const [openAddNoteDialog, setOpenAddNoteDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [color, setColor] = useState("#f59e0b");
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Fetch notes from API
  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get("note/notes/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(res.data.results || []);
    } catch (err) {
      console.error("Error fetching notes:", err);
      toast.error("فشل تحميل الملاحظات");
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Reset form
  const resetForm = () => {
    setTitle("");
    setSubject("");
    setColor("#f59e0b");
    setShowColorPicker(false);
  };

  // Add note
  const handleAddNote = async () => {
    if (!title.trim() || !subject.trim()) {
      toast.error("⚠️ يرجى ملء جميع الحقول");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.post("note/notes/", {
        title: title.trim(),
        subject: subject.trim(),
        color: color,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("✅ تم إضافة الملاحظة بنجاح");
      fetchNotes();
      setOpenAddNoteDialog(false);
      resetForm();
    } catch (err) {
      toast.error("❌ فشل إضافة الملاحظة");
    } finally {
      setLoading(false);
    }
  };

  // Edit note
  const handleEditNote = (note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setSubject(note.subject);
    setColor(note.color || "#f59e0b");
    setOpenEditDialog(true);
  };

  // Save edited note
  const handleSaveEdit = async () => {
    if (!title.trim() || !subject.trim()) {
      toast.error("⚠️ يرجى ملء جميع الحقول");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.put(`note/notes/${selectedNote.id}/`, {
        title: title.trim(),
        subject: subject.trim(),
        color: color,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("✅ تم تعديل الملاحظة بنجاح");
      fetchNotes();
      setOpenEditDialog(false);
      resetForm();
      setSelectedNote(null);
    } catch (err) {
      toast.error("❌ فشل تعديل الملاحظة");
    } finally {
      setLoading(false);
    }
  };

  // Delete note
  const confirmDelete = (id) => {
    setNoteToDelete(id);
    setOpenConfirmDialog(true);
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(`note/notes/${noteToDelete}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("✅ تم حذف الملاحظة بنجاح");
      fetchNotes();
    } catch (err) {
      toast.error("❌ فشل حذف الملاحظة");
    } finally {
      setOpenConfirmDialog(false);
      setNoteToDelete(null);
    }
  };

  // Color presets
  const colorPresets = [
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#10b981", // Emerald
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#ec489a", // Pink
    "#06b6d4", // Cyan
    "#f97316", // Orange
  ];

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("ar-DZ", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">📝</span>
          </div>
          <h1 className="text-2xl text-white">الملاحظات</h1>
        </div>
        <button
          onClick={() => {
            resetForm();
            setOpenAddNoteDialog(true);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-amber-500/50 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>ملاحظة جديدة</span>
        </button>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <span className="text-amber-400 text-xl">📌</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{notes.length}</div>
            <div className="text-sm text-slate-400">إجمالي الملاحظات</div>
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📝</span>
          </div>
          <p className="text-slate-400">لا توجد ملاحظات</p>
          <button
            onClick={() => {
              resetForm();
              setOpenAddNoteDialog(true);
            }}
            className="mt-4 text-amber-400 hover:text-amber-300 transition"
          >
            أضف ملاحظتك الأولى
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4 }}
              className="rounded-xl overflow-hidden shadow-lg transition-all duration-300"
              style={{ backgroundColor: note.color || "#f59e0b" }}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-bold text-lg line-clamp-1">
                    {note.title}
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditNote(note)}
                      className="p-1 hover:bg-white/20 rounded-lg transition"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => confirmDelete(note.id)}
                      className="p-1 hover:bg-white/20 rounded-lg transition"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                <p className="text-white/80 text-sm line-clamp-3 mb-3">
                  {note.subject}
                </p>
                {note.date && (
                  <div className="flex items-center gap-1 text-white/60 text-xs mt-2">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(note.date)}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Note Modal */}
      <AnimatePresence>
        {openAddNoteDialog && (
          <NoteModal
            title="إضافة ملاحظة جديدة"
            buttonText="إضافة"
            loading={loading}
            onClose={() => setOpenAddNoteDialog(false)}
            onSubmit={handleAddNote}
            titleValue={title}
            setTitleValue={setTitle}
            subjectValue={subject}
            setSubjectValue={setSubject}
            colorValue={color}
            setColorValue={setColor}
            showColorPicker={showColorPicker}
            setShowColorPicker={setShowColorPicker}
            colorPresets={colorPresets}
          />
        )}
      </AnimatePresence>

      {/* Edit Note Modal */}
      <AnimatePresence>
        {openEditDialog && (
          <NoteModal
            title="تعديل الملاحظة"
            buttonText="حفظ التغييرات"
            loading={loading}
            onClose={() => {
              setOpenEditDialog(false);
              resetForm();
              setSelectedNote(null);
            }}
            onSubmit={handleSaveEdit}
            titleValue={title}
            setTitleValue={setTitle}
            subjectValue={subject}
            setSubjectValue={setSubject}
            colorValue={color}
            setColorValue={setColor}
            showColorPicker={showColorPicker}
            setShowColorPicker={setShowColorPicker}
            colorPresets={colorPresets}
          />
        )}
      </AnimatePresence>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {openConfirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setOpenConfirmDialog(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-xl w-[400px] overflow-hidden shadow-2xl border border-red-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                <h2 className="text-white text-xl font-bold">تأكيد الحذف</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                  <p className="text-slate-300">هل أنت متأكد أنك تريد حذف هذه الملاحظة؟</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setOpenConfirmDialog(false)}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleDeleteNote}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-red-500/50 transition"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Note Modal Component
function NoteModal({
  title,
  buttonText,
  loading,
  onClose,
  onSubmit,
  titleValue,
  setTitleValue,
  subjectValue,
  setSubjectValue,
  colorValue,
  setColorValue,
  showColorPicker,
  setShowColorPicker,
  colorPresets
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 rounded-xl w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl border border-amber-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-4 flex justify-between items-center sticky top-0">
          <h2 className="text-white text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-1 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-amber-300 text-sm mb-2">العنوان *</label>
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              placeholder="أدخل عنوان الملاحظة"
              className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-4 py-2 outline-none focus:border-amber-500"
            />
          </div>

          {/* Subject Input */}
          <div>
            <label className="block text-amber-300 text-sm mb-2">الموضوع *</label>
            <textarea
              value={subjectValue}
              onChange={(e) => setSubjectValue(e.target.value)}
              placeholder="أدخل محتوى الملاحظة"
              rows={4}
              className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-4 py-2 outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-amber-300 text-sm mb-2">لون الملاحظة</label>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-slate-600 transition"
            >
              <Palette className="w-4 h-4" />
              <span>{showColorPicker ? "إخفاء منتقي الألوان" : "اختر لون"}</span>
            </button>

            {showColorPicker && (
              <div className="mt-3 space-y-3">
                <HexColorPicker color={colorValue} onChange={setColorValue} />
                <div className="flex flex-wrap gap-2 mt-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setColorValue(preset)}
                      className="w-8 h-8 rounded-lg transition-transform hover:scale-110"
                      style={{ backgroundColor: preset }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="mt-4">
            <label className="block text-amber-300 text-sm mb-2">معاينة</label>
            <div
              className="rounded-lg p-4 transition-all"
              style={{ backgroundColor: colorValue }}
            >
              <h4 className="text-white font-bold mb-2">{titleValue || "العنوان"}</h4>
              <p className="text-white/80 text-sm">{subjectValue || "المحتوى"}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              إلغاء
            </button>
            <button
              onClick={onSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-lg hover:shadow-amber-500/50 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {buttonText}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}