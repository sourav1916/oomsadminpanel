import { useCallback, useEffect, useState } from "react";
import { Copy, FileText, Save } from "lucide-react";
import { toast } from "react-toastify";
import apiCall from "../utils/apiCall";
import ManagementHub from "../components/common/ManagementHub";
import ManagementButton from "../components/common/ManagementButton";
import ModalScrollLock from "../components/common/ModalScrollLock";
import { ListPageSkeleton } from "../components/SkeletonComponent";
import ActionMenu from "../components/common/ActionMenu";

const TYPES = ["sale", "purchase", "payment", "receive", "journal", "expense"];

function placeholder(variable) {
  return variable.raw ? `{{{${variable.token}}}}` : `{{${variable.token}}}`;
}

function buildAiPrompt({ invoiceType, variables, format }) {
  const variableLines = (variables || [])
    .map((variable) => `- ${placeholder(variable)} — ${variable.label}`)
    .join("\n");

  const currentBlock = format?.html
    ? `Current format: ${format.name} (${format.format_key}) for ${invoiceType}.

Current HTML:
${format.html}

Revise this template. Keep every Handlebars token that is still needed.`
    : `Create a new HTML invoice template for type "${invoiceType}".
Choose a distinct visual style (name it in an HTML comment at the top).
The admin will paste your HTML over an existing format of this type.`;

  return `You design print-ready HTML invoice templates for OOMS.

Invoice type: ${invoiceType}
Page size: A4 content width 794px. Self-contained HTML document with a <style> block in <head>. No external CSS, fonts, or images unless the image URL is given.
Use Handlebars only. Text tokens are {{name}}. HTML tokens use triple braces. Conditionals are {{#if name}}...{{/if}} and may include {{else}}.

Variables for ${invoiceType}:
${variableLines}

Rules:
- Output only the full HTML document. No markdown fence and no explanation.
- Do not invent tokens that are not in the list above.
- Sale and purchase should show the items table when has_items is set, using {{{items_rows}}} inside a table body.
- Payment, receive, journal, and expense should show the voucher block when is_simple is set.
- Journal should show party2 fields when present.
- Keep company, invoice number, dates, amount, and remark.

${currentBlock}`;
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
  toast.success("Prompt copied. Paste it into the AI, then paste the HTML it returns into the format editor.");
}

export default function InvoiceFormats() {
  const [type, setType] = useState("sale");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formats, setFormats] = useState([]);
  const [variables, setVariables] = useState([]);
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiCall(`/invoice-formats?type=${encodeURIComponent(type)}`, "GET");
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to load invoice formats");
      }
      setFormats(Array.isArray(data.data?.formats) ? data.data.formats : []);
      setVariables(Array.isArray(data.data?.variables) ? data.data.variables : []);
    } catch (err) {
      toast.error(err.message || "Failed to load invoice formats");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = async (row) => {
    setSaving(true);
    try {
      const res = await apiCall(`/invoice-formats/${row.id}`, "GET");
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to load format");
      }
      const record = data.data || {};
      setForm({
        id: record.id,
        invoice_type: record.invoice_type,
        format_key: record.format_key,
        name: record.name || "",
        html: record.html || "",
        accent_color: record.accent_color || "#0056b3",
        status: record.status || "active",
        sort_order: record.sort_order || 0,
      });
      if (Array.isArray(record.variables)) setVariables(record.variables);
    } catch (err) {
      toast.error(err.message || "Failed to load format");
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await apiCall(`/invoice-formats/${form.id}`, "PUT", {
        name: form.name,
        html: form.html,
        accent_color: form.accent_color,
        status: form.status,
        sort_order: Number(form.sort_order) || 0,
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Save failed");
      }
      toast.success("Format updated");
      setForm(null);
      await load();
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete the ${row.name} format for ${row.invoice_type}?`)) return;
    try {
      const res = await apiCall(`/invoice-formats/${row.id}`, "DELETE");
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Delete failed");
      }
      toast.success("Format deleted");
      await load();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    }
  };

  return (
    <ManagementHub
      eyebrow="Settings"
      title="Invoice formats"
      description="Edit the HTML for an existing format. Copy the AI prompt when you want another design, then paste the HTML the AI returns into this form."
      onRefresh={load}
      refreshing={loading}
      actions={
        <ManagementButton
          type="button"
          variant="outline"
          onClick={() => copyText(buildAiPrompt({ invoiceType: type, variables })).catch(() => toast.error("Could not copy the prompt"))}
        >
          <Copy className="h-4 w-4" />
          Copy AI prompt
        </ManagementButton>
      }
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        {TYPES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setType(item)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize ${
              type === item
                ? "bg-admin-accent-soft text-admin-accent-text"
                : "bg-admin-raised text-admin-text-sub"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <ListPageSkeleton columns={5} rows={6} />
      ) : formats.length === 0 ? (
        <div className="admin-panel py-16 text-center">
          <FileText className="mx-auto mb-3 text-admin-muted" />
          <p className="text-sm font-semibold text-admin-text-sub">No formats for this type</p>
        </div>
      ) : (
        <div className="admin-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-admin-raised text-left text-[11px] uppercase tracking-wider text-admin-muted">
              <tr>
                <th className="w-12 px-4 py-2 font-semibold">S.No</th>
                <th className="px-4 py-2 font-semibold">Format</th>
                <th className="px-4 py-2 font-semibold">Key</th>
                <th className="px-4 py-2 font-semibold">Accent</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="w-16 px-4 py-2 font-semibold"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {formats.map((row, index) => (
                <tr key={row.id} className="hover:bg-admin-raised">
                  <td className="px-4 py-2.5 tabular-nums text-admin-muted">{index + 1}</td>
                  <td className="px-4 py-2.5 font-semibold text-admin-text">{row.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-admin-text-sub">{row.format_key}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-2 text-xs text-admin-text-sub">
                      <span className="h-4 w-4 rounded-sm border border-admin-border" style={{ background: row.accent_color }} />
                      {row.accent_color}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 capitalize text-admin-text-sub">{row.status}</td>
                  <td className="px-4 py-2.5">
                    <ActionMenu
                      actions={[
                        { label: "Edit HTML", onClick: () => openEdit(row) },
                        { label: "Delete", danger: true, onClick: () => remove(row) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <>
          <ModalScrollLock />
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="admin-panel flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden">
              <div className="border-b border-admin-border px-5 py-4">
                <h2 className="text-lg font-bold text-admin-text">{form.name}</h2>
                <p className="text-xs capitalize text-admin-muted">
                  {form.invoice_type} · {form.format_key}
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <label className="admin-label">HTML</label>
                <textarea
                  value={form.html}
                  onChange={(event) => setForm({ ...form, html: event.target.value })}
                  spellCheck={false}
                  className="admin-textarea min-h-[420px] font-mono text-xs leading-relaxed"
                />
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-admin-border px-5 py-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-admin-text-sub hover:bg-admin-raised"
                  onClick={() => copyText(buildAiPrompt({
                    invoiceType: form.invoice_type,
                    variables,
                    format: form,
                  })).catch(() => toast.error("Could not copy the prompt"))}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy AI prompt
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-admin-muted hover:bg-admin-raised"
                    onClick={() => setForm(null)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <ManagementButton type="button" onClick={save} disabled={saving}>
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save HTML"}
                  </ManagementButton>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </ManagementHub>
  );
}
