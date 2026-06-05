import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import { showError, showSuccess } from '../../utils/notify';

export default function QuotationDetail({ quotationIdProp, onBack }) {
  const [id, setId] = useState(quotationIdProp || localStorage.getItem('activeQuotationId'));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(()=>{ if(!id) return; load(); }, [id]);

  async function load(){
    setLoading(true);
    try{
      const res = await adminService.getQuotation(id);
      setData(res.data?.data || res.data || null);
    }catch(e){ showError(e?.response?.data?.message || e?.message || 'Không tải được báo giá'); }
    finally{ setLoading(false); }
  }

  function formatVND(n){ if(n==null) return '-'; return new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ'; }

  // Upload helper: expects window.CLOUDINARY_UPLOAD_URL to be set to unsigned upload URL
  async function uploadToCloud(file){
    const url = window.CLOUDINARY_UPLOAD_URL;
    if(!url) throw new Error('No cloud upload URL configured. Set window.CLOUDINARY_UPLOAD_URL to your upload endpoint (e.g., https://api.cloudinary.com/v1_1/<cloud>/auto/upload).');
    const fd = new FormData();
    fd.append('file', file);
    // If using Cloudinary unsigned you might need upload_preset param; allow global
    if(window.CLOUDINARY_UPLOAD_PRESET) fd.append('upload_preset', window.CLOUDINARY_UPLOAD_PRESET);
    const resp = await fetch(url, { method: 'POST', body: fd });
    if(!resp.ok) throw new Error('Upload failed');
    const json = await resp.json();
    return json.secure_url || json.url;
  }

  async function handleFileSelect(file){
    try{
      setUploading(true);
      const fileUrl = await uploadToCloud(file);
      await adminService.createQuotationAttachment(id, { name: file.name, file_url: fileUrl });
      showSuccess('Upload thành công và lưu attachment');
      await load();
    }catch(e){ showError(e?.message || 'Upload thất bại'); }
    finally{ setUploading(false); }
  }

  async function changeStatus(newStatus){
    try{
      await adminService.updateQuotationStatus(id, { status: newStatus });
      showSuccess('Cập nhật trạng thái thành công');
      await load();
    }catch(e){ showError(e?.response?.data?.message || e?.message || 'Cập nhật thất bại'); }
  }

  if(!id) return <div className="rounded-2xl border border-outline-variant/60 bg-white p-4">Không có báo giá được chọn.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-2xl border border-outline-variant/60 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black">Chi tiết Báo giá</h3>
            <div className="text-xs text-on-surface-variant/70">Mã: {id}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>{ localStorage.removeItem('activeQuotationId'); onBack?.(); }} className="rounded-lg border border-outline-variant/60 px-3 py-2">Quay lại</button>
          </div>
        </div>

        {loading ? <div>Đang tải...</div> : null}

        {data && (
          <div>
            <h4 className="font-black">Hóa đơn chi tiết</h4>
            <div className="mt-3">
              {/* assume backend returns dimensions.breakdown_costs or breakdown_costs */}
              {((data.dimensions && data.dimensions.breakdown_costs) || data.breakdown_costs || []).map((b, i)=> (
                <div key={i} className="flex items-center justify-between border-b py-2">
                  <div className="text-sm">{b.name}</div>
                  <div className="font-black">{formatVND(b.amount)}</div>
                </div>
              ))}

              <div className="mt-4 border-t pt-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-on-surface-variant/80">Tổng</div>
                  <div className="text-lg font-black">{formatVND(data.total_amount ?? data.total)}</div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-black">Attachments</h4>
              <div className="mt-2 space-y-2">
                {(data.attachments || []).map(att => (
                  <div key={att.id || att.file_url} className="flex items-center justify-between border rounded px-3 py-2">
                    <div className="truncate">{att.name || att.file_name}</div>
                    <a href={att.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary">Mở</a>
                  </div>
                ))}
                {(!data.attachments || data.attachments.length===0) && (<div className="text-sm text-on-surface-variant/70">Chưa có file đính kèm</div>)}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-1 rounded-2xl border border-outline-variant/60 bg-white p-4 shadow-sm">
        <h4 className="font-black">Quản lý Bản vẽ</h4>
        <div className="mt-3">
          <div className="border-dashed border-2 border-outline-variant/40 rounded-xl p-4 text-center">
            <p className="text-sm text-on-surface-variant/70">Kéo thả file vào đây (ảnh/pdf) hoặc chọn file</p>
            <div className="mt-3">
              <input type="file" onChange={(e)=>{ const f=e.target.files?.[0]; if(f) handleFileSelect(f); }} />
            </div>
            {uploading && <div className="mt-2 text-sm">Đang upload...</div>}
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-black">Chốt đơn</h4>
          <div className="mt-3 space-y-2">
            {data && data.status === 'draft' ? (
              <>
                <button onClick={()=>changeStatus('approved')} className="w-full rounded-xl bg-primary px-4 py-2 text-white">CHỐT ĐƠN</button>
                <button onClick={()=>changeStatus('cancelled')} className="w-full rounded-xl border border-outline-variant/60 px-4 py-2 text-rose-600">HỦY BÁO GIÁ</button>
              </>
            ) : (
              <div className="text-sm text-on-surface-variant/70">Không thể thay đổi trạng thái (đã chốt hoặc đã hủy).</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
