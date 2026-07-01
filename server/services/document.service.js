import Document from '../models/Document.js';
import { logActivity } from '../utils/activityLogger.js';

class DocumentService {
  async getAll({ category, search, project }) {
    const query = {};
    if (category) {
      query.category = category;
    }
    if (project) {
      query.project = project;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    return await Document.find(query)
      .populate('uploadedBy', 'name designation avatar')
      .populate('project', 'name')
      .sort({ createdAt: -1 });
  }

  async getById(id) {
    const doc = await Document.findById(id)
      .populate('uploadedBy', 'name designation avatar')
      .populate('project', 'name');
    if (!doc) {
      const error = new Error('Document not found');
      error.statusCode = 404;
      throw error;
    }
    return doc;
  }

  async create(data) {
    const doc = new Document(data);
    await doc.save();

    const notificationService = (await import('./notification.service.js')).default;
    await notificationService.notifyDocumentUploaded(doc.name, doc.category);

    await logActivity({
      action: 'Created',
      entity: 'Document',
      entityId: doc._id,
      description: `Uploaded document: ${doc.name} (Category: ${doc.category})`
    });

    return doc;
  }

  async delete(id) {
    const doc = await Document.findById(id);
    if (!doc) {
      const error = new Error('Document not found');
      error.statusCode = 404;
      throw error;
    }

    await Document.findByIdAndDelete(id);

    await logActivity({
      action: 'Deleted',
      entity: 'Document',
      entityId: id,
      description: `Deleted document: ${doc.name}`
    });

    return doc;
  }
}

export default new DocumentService();
