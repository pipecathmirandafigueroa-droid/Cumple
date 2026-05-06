"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Trash2, Edit2, Shield, User, Star, Save, X, RefreshCw, Upload, Download } from "lucide-react";
import PremiumToast, { PremiumToastItem, PremiumToastType } from "@/components/PremiumToast";
import * as XLSX from "xlsx";

interface Guest {
    id: string;
    code: string;
    name: string;
    role: "admin" | "principal" | "user";
}

interface BulkGuestRow {
    code: string;
    name: string;
    role: Guest["role"];
}

export default function AdminPanel() {
    const [guests, setGuests] = useState<Guest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toasts, setToasts] = useState<PremiumToastItem[]>([]);
    const [pendingDeleteGuest, setPendingDeleteGuest] = useState<Guest | null>(null);
    const [isBulkSaving, setIsBulkSaving] = useState(false);
    const [bulkRows, setBulkRows] = useState<BulkGuestRow[]>([]);
    const [bulkErrors, setBulkErrors] = useState<string[]>([]);

    const pushToast = (type: PremiumToastType, title: string, message: string) => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setToasts((prev) => [...prev, { id, type, title, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((item) => item.id !== id));
        }, 4200);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
    };
    
    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        codigo: "",
        nombreReal: "",
        usuario: "",
        role: "user" as Guest["role"]
    });

    const fetchGuests = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('guests')
            .select('*')
            .order('name', { ascending: true });
        
        if (data && !error) setGuests(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchGuests();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const guestData = {
            code: formData.usuario.trim(),
            name: formData.nombreReal,
            role: formData.role
        };

        let error;
        if (editingId) {
            const { error: err } = await supabase
                .from('guests')
                .update(guestData)
                .eq('id', editingId);
            error = err;
        } else {
            const { error: err } = await supabase
                .from('guests')
                .insert([guestData]);
            error = err;
        }

        if (!error) {
            setFormData({ codigo: "", nombreReal: "", usuario: "", role: "user" });
            setEditingId(null);
            fetchGuests();
            pushToast("success", editingId ? "Invitado actualizado" : "Invitado creado", "Los datos se guardaron correctamente.");
        } else {
            pushToast("error", "Error al guardar", error.message);
        }
        setIsSaving(false);
    };

    const handleDeleteConfirmed = async () => {
        if (!pendingDeleteGuest) return;

        const { error } = await supabase
            .from('guests')
            .delete()
            .eq('id', pendingDeleteGuest.id);

        if (!error) {
            fetchGuests();
            pushToast("success", "Invitado eliminado", `Se elimino a ${pendingDeleteGuest.name} correctamente.`);
        } else {
            pushToast("error", "Error al eliminar", error.message);
        }

        setPendingDeleteGuest(null);
    };

    const startEdit = (guest: Guest) => {
        setEditingId(guest.id);
        setFormData({
            codigo: "",
            nombreReal: guest.name,
            usuario: guest.code,
            role: guest.role
        });
    };

    const parseBulkFile = async (file: File) => {
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

            if (rawRows.length === 0) {
                setBulkRows([]);
                setBulkErrors(["El archivo no contiene filas."]);
                return;
            }

            const existingCodes = new Set(guests.map((g) => g.code.toLowerCase()));
            const seenInFile = new Set<string>();
            const parsed: BulkGuestRow[] = [];
            const errors: string[] = [];

            rawRows.forEach((row, index) => {
                const rowNumber = index + 2;
                const code = String(
                    row.usuario ?? row.USUARIO ?? row.user ?? row.USER ?? row.code ?? row.CODE ?? ""
                ).trim();
                const name = String(
                    row["nombre real"] ?? row["NOMBRE REAL"] ?? row.nombre_real ?? row.NOMBRE_REAL ?? row.name ?? row.NAME ?? ""
                ).trim();
                const roleRaw = String(row.rol ?? row.ROL ?? row.role ?? row.ROLE ?? "user").trim().toLowerCase();
                const role = (roleRaw || "user") as Guest["role"];

                if (!code || !name) {
                    errors.push(`Fila ${rowNumber}: usuario y nombre real son obligatorios.`);
                    return;
                }

                if (!["user", "principal", "admin"].includes(role)) {
                    errors.push(`Fila ${rowNumber}: role debe ser user, principal o admin.`);
                    return;
                }

                if (existingCodes.has(code.toLowerCase())) {
                    errors.push(`Fila ${rowNumber}: el usuario ${code} ya existe.`);
                    return;
                }

                if (seenInFile.has(code.toLowerCase())) {
                    errors.push(`Fila ${rowNumber}: el usuario ${code} esta duplicado dentro del archivo.`);
                    return;
                }

                seenInFile.add(code.toLowerCase());
                parsed.push({ code, name, role });
            });

            setBulkRows(parsed);
            setBulkErrors(errors);

            if (errors.length === 0 && parsed.length > 0) {
                pushToast("info", "Archivo validado", `${parsed.length} usuarios listos para crear.`);
            } else if (errors.length > 0) {
                pushToast("error", "Errores en archivo", "Corrige los errores detectados antes de crear usuarios.");
            }
        } catch {
            setBulkRows([]);
            setBulkErrors(["No se pudo leer el archivo. Usa .xlsx, .xls o .csv."]);
            pushToast("error", "Lectura fallida", "No se pudo procesar el archivo seleccionado.");
        }
    };

    const createUsersInBulk = async () => {
        if (bulkRows.length === 0) {
            pushToast("info", "Sin datos", "Primero sube y valida un archivo con usuarios.");
            return;
        }
        if (bulkErrors.length > 0) {
            pushToast("error", "Archivo invalido", "No se puede crear usuarios mientras haya errores de validacion.");
            return;
        }

        setIsBulkSaving(true);
        const { error } = await supabase.from("guests").insert(bulkRows);

        if (error) {
            pushToast("error", "Error en creacion masiva", error.message);
            setIsBulkSaving(false);
            return;
        }

        pushToast("success", "Usuarios creados", `Se crearon ${bulkRows.length} usuarios correctamente.`);
        setBulkRows([]);
        setBulkErrors([]);
        setIsBulkSaving(false);
        fetchGuests();
    };

    return (
        <div className="space-y-12">
            <PremiumToast toasts={toasts} onClose={removeToast} />
            {/* FORMULARIO DE GESTIÓN */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-8 md:p-12 rounded-[3.5rem] border border-b-gold/20 shadow-2xl"
            >
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-b-gold/20 rounded-2xl text-b-gold">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif italic dark:text-white">
                            {editingId ? "Editar Invitado" : "Nuevo Invitado"}
                        </h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Gestión de Acceso Real</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-b-gold ml-2">Codigo</label>
                        <input
                            type="text"
                            value={formData.codigo}
                            onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                            placeholder="EJ: 001"
                            className="w-full bg-black/5 dark:bg-white/5 px-6 py-4 rounded-2xl outline-none border border-transparent focus:border-b-gold/30 dark:text-white font-bold tracking-widest"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-b-gold ml-2">Nombre Real</label>
                        <input
                            type="text"
                            value={formData.nombreReal}
                            onChange={(e) => setFormData({...formData, nombreReal: e.target.value})}
                            placeholder="Nombre del invitado"
                            className="w-full bg-black/5 dark:bg-white/5 px-6 py-4 rounded-2xl outline-none border border-transparent focus:border-b-gold/30 dark:text-white"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-b-gold ml-2">Usuario</label>
                        <input
                            type="text"
                            value={formData.usuario}
                            onChange={(e) => setFormData({...formData, usuario: e.target.value})}
                            placeholder="EJ: INVITADO2026"
                            className="w-full bg-black/5 dark:bg-white/5 px-6 py-4 rounded-2xl outline-none border border-transparent focus:border-b-gold/30 dark:text-white font-bold tracking-widest"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-b-gold ml-2">Rol</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value as Guest["role"]})}
                            className="w-full bg-black/5 dark:bg-white/5 px-6 py-4 rounded-2xl outline-none border border-transparent focus:border-b-gold/30 dark:text-white appearance-none"
                        >
                            <option value="user">Invitado (Estándar)</option>
                            <option value="principal">Cumpleañera (Reina)</option>
                            <option value="admin">Administrador (Control)</option>
                        </select>
                    </div>

                    <div className="md:col-span-3 flex justify-end gap-4 pt-4">
                        {editingId && (
                            <button 
                                type="button"
                                onClick={() => { setEditingId(null); setFormData({codigo:"", nombreReal:"", usuario:"", role:"user"}); }}
                                className="px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                            >
                                <X className="w-4 h-4 inline mr-2" /> Cancelar
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-14 py-4 bg-b-gold text-b-blue-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                        >
                            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {editingId ? "Actualizar" : "Registrar"}
                        </button>
                    </div>
                </form>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6 sm:p-8 rounded-[2.5rem] border border-b-gold/20 shadow-2xl"
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-2xl font-serif italic dark:text-white">Creacion por Lote</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">Excel o CSV</p>
                    </div>
                    <a
                        href="/templates/guests-bulk-template.xlsx"
                        download
                        className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-b-gold/20 border border-b-gold/30 text-b-gold text-xs font-black uppercase tracking-[0.2em]"
                    >
                        <Download className="w-4 h-4" />
                        Plantilla
                    </a>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <label className="flex-1 min-h-[44px] cursor-pointer px-4 py-3 rounded-xl border border-b-gold/20 bg-black/5 dark:bg-white/5 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-3">
                        <Upload className="w-4 h-4 text-b-gold" />
                        <span>Subir archivo .xlsx, .xls o .csv</span>
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) parseBulkFile(file);
                            }}
                        />
                    </label>

                    <button
                        type="button"
                        onClick={createUsersInBulk}
                        disabled={isBulkSaving || bulkRows.length === 0 || bulkErrors.length > 0}
                        className="min-h-[44px] px-6 py-3 rounded-xl bg-b-gold text-b-blue-950 font-black text-xs uppercase tracking-[0.2em] disabled:opacity-40"
                    >
                        {isBulkSaving ? "Creando..." : `Crear ${bulkRows.length}`}
                    </button>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Filas validas</p>
                        <p className="text-xl font-bold text-b-gold">{bulkRows.length}</p>
                    </div>
                    <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Errores</p>
                        <p className="text-xl font-bold text-red-400">{bulkErrors.length}</p>
                    </div>
                    <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Usuarios activos</p>
                        <p className="text-xl font-bold text-emerald-400">{guests.length}</p>
                    </div>
                </div>

                {bulkErrors.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 max-h-48 overflow-auto space-y-2">
                        {bulkErrors.map((err, idx) => (
                            <p key={idx} className="text-xs text-red-100">{err}</p>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* LISTA DE INVITADOS */}
            <div>
                <h3 className="text-2xl font-serif italic dark:text-white">Listado de Usuarios Activos</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">Total: {guests.length}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                    {guests.map((guest) => (
                        <motion.div
                            key={guest.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass p-8 rounded-[2.5rem] border border-b-gold/10 relative group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-3 rounded-2xl ${
                                    guest.role === 'admin' ? 'bg-red-500/10 text-red-500' :
                                    guest.role === 'principal' ? 'bg-b-gold/20 text-b-gold' :
                                    'bg-blue-500/10 text-blue-500'
                                }`}>
                                    {guest.role === 'admin' ? <Shield className="w-5 h-5" /> : 
                                     guest.role === 'principal' ? <Star className="w-5 h-5" /> : 
                                     <User className="w-5 h-5" />}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(guest)} className="p-2 hover:text-b-gold transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setPendingDeleteGuest(guest)} className="p-2 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-serif italic dark:text-white mb-1">{guest.name}</h3>
                            <p className="text-[10px] font-black text-b-gold uppercase tracking-[0.2em] mb-4">
                                {guest.role}
                            </p>
                            
                            <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                                <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 block mb-1 uppercase tracking-tighter">Código de Acceso:</span>
                                <span className="text-sm font-black tracking-[0.3em] dark:text-white">{guest.code}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {pendingDeleteGuest && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 6 }}
                            className="w-full max-w-md rounded-3xl border border-red-400/40 bg-b-blue-950/95 p-6 sm:p-7 shadow-2xl"
                        >
                            <h3 className="text-lg sm:text-xl font-playfair text-red-200">Confirmar eliminacion</h3>
                            <p className="mt-3 text-sm sm:text-base text-red-100/90 leading-relaxed">
                                Vas a eliminar a {pendingDeleteGuest.name}. Esta accion no se puede deshacer.
                            </p>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPendingDeleteGuest(null)}
                                    className="min-h-[44px] flex-1 rounded-2xl bg-white/10 text-white font-poppins font-semibold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteConfirmed}
                                    className="min-h-[44px] flex-1 rounded-2xl bg-red-500/90 text-white font-poppins font-black uppercase tracking-[0.2em] text-xs"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
