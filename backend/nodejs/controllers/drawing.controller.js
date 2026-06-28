const drawingService = require('../services/drawing.service');

class DrawingController {
  
  // GET /api/drawings/product/:productId
  async getDrawingsByProduct(req, res) {
    try {
      const { productId } = req.params;
      const drawings = await drawingService.getDrawingsByProduct(productId);
      
      res.status(200).json({ success: true, data: drawings });
    } catch (error) {
      console.error("Lỗi getDrawingsByProduct:", error);
      res.status(500).json({ success: false, message: 'Lỗi server khi tải bản vẽ!' });
    }
  }

  // GET /api/drawings/:id
  async getDrawingById(req, res) {
    try {
      const { id } = req.params;
      const drawing = await drawingService.getDrawingById(id);
      
      if (!drawing) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bản vẽ!' });
      }
      
      res.status(200).json({ success: true, data: drawing });
    } catch (error) {
      console.error("Lỗi getDrawingById:", error);
      res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
  }

  // POST /api/drawings
  async createDrawing(req, res) {
    try {
      // req.body chứa thông tin master và mảng 'parts'
      const newDrawing = await drawingService.createDrawing(req.body);
      res.status(201).json({ 
        success: true, 
        message: 'Tạo bản vẽ thành công!', 
        data: newDrawing 
      });
    } catch (error) {
      console.error("Lỗi createDrawing:", error);
      res.status(500).json({ success: false, message: 'Lỗi khi lưu bản vẽ!' });
    }
  }

  // PUT /api/drawings/:id
  async updateDrawing(req, res) {
    try {
      const { id } = req.params;
      const updatedDrawing = await drawingService.updateDrawing(id, req.body);
      
      res.status(200).json({ 
        success: true, 
        message: 'Cập nhật bản vẽ thành công!', 
        data: updatedDrawing 
      });
    } catch (error) {
      console.error("Lỗi updateDrawing:", error);
      res.status(500).json({ success: false, message: 'Lỗi khi cập nhật bản vẽ!' });
    }
  }

  // DELETE /api/drawings/:id
  async deleteDrawing(req, res) {
    try {
      const { id } = req.params;
      await drawingService.deleteDrawing(id);
      
      res.status(200).json({ success: true, message: 'Đã xóa bản vẽ!' });
    } catch (error) {
      console.error("Lỗi deleteDrawing:", error);
      res.status(500).json({ success: false, message: 'Lỗi khi xóa bản vẽ!' });
    }
  }
}

module.exports = new DrawingController();