import React, { useState, useEffect } from "react";

const AddressSelect = ({ value, onChange, disabled }) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [street, setStreet] = useState("");

  const normalize = (str) => {
    if (!str) return "";
    return str.toLowerCase().replace(/^(tỉnh|thành phố|tp|quận|huyện|thị xã|phường|xã|thị trấn)\s+/i, '').trim();
  };

  const matchName = (name1, name2) => normalize(name1) === normalize(name2);

  // 1. Load danh sách Tỉnh/Thành
  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/p/")
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch((err) => console.error(err));
  }, []);

  // 2. Tự động đọc Address từ DB và khớp lại vào Dropdown
  useEffect(() => {
    if (value && provinces.length > 0 && !selectedProvince) {
      const parts = value.split(",").map((s) => s.trim());

      if (parts.length >= 4) {
        const pName = parts[parts.length - 1];
        const dName = parts[parts.length - 2];
        const wName = parts[parts.length - 3];
        const streetName = parts.slice(0, parts.length - 3).join(", ");

        const p = provinces.find((x) => matchName(pName, x.name) || pName.includes(x.name));
        
        if (p) {
          setSelectedProvince(p.code);
          fetch(`https://provinces.open-api.vn/api/p/${p.code}?depth=2`)
            .then((res) => res.json())
            .then((data) => {
              setDistricts(data.districts || []);
              const d = (data.districts || []).find((x) => matchName(dName, x.name) || dName.includes(x.name));
              
              if (d) {
                setSelectedDistrict(d.code);
                fetch(`https://provinces.open-api.vn/api/d/${d.code}?depth=2`)
                  .then((res) => res.json())
                  .then((wData) => {
                    setWards(wData.wards || []);
                    const w = (wData.wards || []).find((x) => matchName(wName, x.name) || wName.includes(x.name));
                    if (w) setSelectedWard(w.code);
                  });
              }
            });
        }
        setStreet(streetName);
      } else {
        setStreet(value);
      }
    }
  }, [value, provinces, selectedProvince]);

  const handleUpdateAddress = (newStreet, newProvinceCode, newDistrictCode, newWardCode, currentDistricts, currentWards) => {
    const pName = provinces.find((p) => String(p.code) === String(newProvinceCode))?.name || "";
    const dName = (currentDistricts || districts).find((d) => String(d.code) === String(newDistrictCode))?.name || "";
    const wName = (currentWards || wards).find((w) => String(w.code) === String(newWardCode))?.name || "";

    const fullAddress = [newStreet, wName, dName, pName].filter(Boolean).join(", ");
    onChange(fullAddress);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select
          disabled={disabled}
          value={selectedProvince}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedProvince(val);
            if (val) {
              fetch(`https://provinces.open-api.vn/api/p/${val}?depth=2`)
                .then((res) => res.json())
                .then((data) => {
                  const newDistricts = data.districts || [];
                  setDistricts(newDistricts);
                  setSelectedDistrict("");
                  setWards([]);
                  handleUpdateAddress(street, val, "", "", newDistricts, []);
                });
            } else {
              setDistricts([]);
              setSelectedDistrict("");
              setWards([]);
              handleUpdateAddress(street, "", "", "", [], []);
            }
          }}
          className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/10 px-4 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60"
        >
          <option value="">Chọn Tỉnh/Thành phố</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          disabled={!selectedProvince || disabled}
          value={selectedDistrict}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedDistrict(val);
            if (val) {
              fetch(`https://provinces.open-api.vn/api/d/${val}?depth=2`)
                .then((res) => res.json())
                .then((data) => {
                  const newWards = data.wards || [];
                  setWards(newWards);
                  setSelectedWard("");
                  handleUpdateAddress(street, selectedProvince, val, "", districts, newWards);
                });
            } else {
              setWards([]);
              setSelectedWard("");
              handleUpdateAddress(street, selectedProvince, "", "", districts, []);
            }
          }}
          className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/10 px-4 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60"
        >
          <option value="">Chọn Quận/Huyện</option>
          {districts.map((d) => (
            <option key={d.code} value={d.code}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          disabled={!selectedDistrict || disabled}
          value={selectedWard}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedWard(val);
            handleUpdateAddress(street, selectedProvince, selectedDistrict, val, districts, wards);
          }}
          className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/10 px-4 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60"
        >
          <option value="">Chọn Phường/Xã</option>
          {wards.map((w) => (
            <option key={w.code} value={w.code}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <input
        type="text"
        disabled={disabled}
        value={street}
        onChange={(e) => {
          setStreet(e.target.value);
          handleUpdateAddress(e.target.value, selectedProvince, selectedDistrict, selectedWard, districts, wards);
        }}
        placeholder="Số nhà, tên đường, tòa nhà..."
        className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/10 px-4 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60"
      />
    </div>
  );
};

export default AddressSelect;
