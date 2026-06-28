import React from 'react';

const DrawingViewer = ({ drawingData, quoteSpecs, productDefaultSpecs }) => {
  if (!drawingData) return null;

  // Fallback mechanic
  const getMaterialForPart = (partCategory) => {
    // 1. User selected specs in their quotation
    if (quoteSpecs && quoteSpecs[partCategory]) return quoteSpecs[partCategory];
    // 2. Default specs for the product
    if (productDefaultSpecs && productDefaultSpecs[partCategory]) return productDefaultSpecs[partCategory];
    // 3. Absolute fallback
    return "Tiêu chuẩn KPM";
  };

  return (
    <div className="drawing-container border border-gray-300 bg-white rounded-lg overflow-hidden shadow-sm mt-4 mb-4">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="text-xl font-bold uppercase text-gray-800">{drawingData.drawing_name}</h2>
        <div className="text-sm text-gray-600 font-medium flex gap-4">
          <span>Tỷ lệ: {drawingData.scale_ratio}</span>
          <span>Kích thước: {quoteSpecs?.length || 0} x {quoteSpecs?.width || 0} x {quoteSpecs?.height || 0} mm</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12">
        {/* Main Image */}
        <div className="col-span-12 md:col-span-8 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 min-h-[400px]">
          <img 
            src={drawingData.main_image_url} 
            alt="Bản vẽ tổng" 
            className="w-full h-auto object-contain max-h-[500px]" 
          />
        </div>

        {/* Component Breakdown */}
        <div className="col-span-12 md:col-span-4 p-4 bg-gray-50 flex flex-col h-full">
          <h3 className="font-semibold text-lg text-gray-700 border-b border-gray-300 pb-2 mb-4">
            Bóc tách linh kiện
          </h3>
          
          <div className="flex flex-col gap-3 overflow-y-auto pr-1" style={{ maxHeight: '460px' }}>
            {drawingData.drawing_parts?.map(part => (
              <div key={part.id} className="part-card flex border border-gray-200 p-2 rounded bg-white hover:border-blue-300 transition-colors">
                <div className="w-16 h-16 flex-shrink-0 border border-gray-200 rounded overflow-hidden">
                  <img src={part.part_image_url || '/placeholder.png'} alt={part.component_name} className="w-full h-full object-cover" />
                </div>
                <div className="ml-3 flex flex-col justify-center">
                  <div className="font-bold text-sm text-gray-900">{part.component_name}</div>
                  <div className="mt-2">
                    <span className="inline-block bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-blue-200">
                      {getMaterialForPart(part.material_category)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {(!drawingData.drawing_parts || drawingData.drawing_parts.length === 0) && (
              <div className="text-center text-sm text-gray-500 py-4">Chưa có linh kiện chi tiết</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawingViewer;
