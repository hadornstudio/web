import mongoose from 'mongoose';

const { Schema } = mongoose;

const likeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    galleryItem: { type: Schema.Types.ObjectId, ref: 'GalleryItem', required: true },
  },
  { timestamps: true }
);

likeSchema.index({ user: 1, galleryItem: 1 }, { unique: true });
likeSchema.index({ galleryItem: 1, createdAt: -1 });

likeSchema.statics.recalculateLikesCount = async function recalculateLikesCount(galleryItemId) {
  const GalleryItem = mongoose.model('GalleryItem');
  const count = await this.countDocuments({ galleryItem: galleryItemId });
  await GalleryItem.findByIdAndUpdate(galleryItemId, { likesCount: count });
};

// Returning the promise (not just calling it) matters — Mongoose only awaits post hooks
// that return a promise, otherwise this races with whatever reads the count right after.
likeSchema.post('save', function afterSave() {
  return this.constructor.recalculateLikesCount(this.galleryItem);
});

likeSchema.post('findOneAndDelete', function afterDelete(doc) {
  if (doc) return doc.constructor.recalculateLikesCount(doc.galleryItem);
});

export default mongoose.model('Like', likeSchema);
