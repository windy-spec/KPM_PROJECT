const invoiceService = require("../services/invoice.service");

class InvoiceController {
  async getMyInvoices(req, res) {
    try {
      const invoices = await invoiceService.getUserInvoices(req.user.id);
      res.status(200).json({ success: true, data: invoices });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async getInvoiceDetail(req, res) {
    try {
      const invoice = await invoiceService.getInvoiceById(
        req.params.id,
        req.user.id,
      );
      res.status(200).json({ success: true, data: invoice });
    } catch (e) {
      res.status(404).json({ success: false, message: e.message });
    }
  }
}

module.exports = new InvoiceController();
