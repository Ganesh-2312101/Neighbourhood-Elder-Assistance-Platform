const { decrypt } = require('../services/cryptoService');

/**
 * Privacy preservation helper:
 * Filters out raw address and phone/email details if task status is PENDING or user is not assigned volunteer / requester.
 * Unmasks decrypted phone number when task is ASSIGNED so native phone dialer can be triggered.
 */
function maskTaskPrivacy(task, currentUserId) {
  if (!task) return task;

  const isRequester = task.requester_id === currentUserId;
  const isAssignedVolunteer = task.assigned_volunteer_id === currentUserId;
  const isUnlocked = isRequester || (isAssignedVolunteer && ['assigned', 'in_progress', 'completed'].includes(task.status));

  const copy = { ...task };

  if (!isUnlocked) {
    // Mask exact location and contact info pre-assignment
    delete copy.full_address;
    delete copy.requester_phone;
    delete copy.volunteer_phone;
    delete copy.requester_email;
    delete copy.requester_trusted_contact_phone;
    copy.full_address_masked = true;
  } else {
    // Unmask phone numbers for assigned parties if present
    if (copy.requester_phone_encrypted) {
      copy.requester_phone = decrypt(copy.requester_phone_encrypted);
    }
    if (copy.volunteer_phone_encrypted) {
      copy.volunteer_phone = decrypt(copy.volunteer_phone_encrypted);
    }
  }

  return copy;
}

module.exports = {
  maskTaskPrivacy
};
