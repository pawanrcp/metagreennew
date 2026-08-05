const fs = require('fs');
const content = fs.readFileSync('src/components/Compliance.tsx', 'utf8');

const regex = /const handleSubmitRecord = async \([\s\S]*?const handleDownloadCertificate/m;
const replacement = `const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRecordId) {
        await updateDoc(doc(db, 'complianceRecords', editingRecordId), newRecord);
      } else {
        await addDoc(collection(db, 'complianceRecords'), {
          ...newRecord,
          status: 'Pending',
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingRecordId(null);
      setNewRecord({
        projectId: '',
        customerName: '',
        type: 'Electrical Safety Inspection',
        applicationDate: format(new Date(), 'yyyy-MM-dd'),
        remarks: ''
      });
    } catch (err) {
      console.error('Error saving compliance record:', err);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this compliance record?")) {
      try {
        await deleteDoc(doc(db, 'complianceRecords', id));
      } catch (err) {
        console.error('Error deleting compliance record:', err);
      }
    }
  };

  const handleDownloadCertificate`;

const newContent = content.replace(regex, replacement);
fs.writeFileSync('src/components/Compliance.tsx', newContent);
