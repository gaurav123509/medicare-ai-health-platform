const { uniqueStrings } = require('../utils/validators');

const criticalKeywords = [
  'chest pain',
  'not breathing',
  'difficulty breathing',
  'unconscious',
  'seizure',
  'stroke',
  'severe bleeding',
];

const highPriorityKeywords = [
  'high fever',
  'severe pain',
  'accident',
  'fainting',
  'pregnancy bleeding',
];

const assessEmergency = async (payload, user) => {
  const symptoms = uniqueStrings(payload.symptoms).map((item) => item.toLowerCase());
  const symptomText = `${String(payload.emergencyType || '')} ${String(payload.message || '')} ${symptoms.join(' ')}`.toLowerCase();
  const contacts = uniqueStrings(payload.contactsNotified);

  if (user?.emergencyContact?.phone) {
    contacts.push(user.emergencyContact.phone);
  }

  let priority = 'medium';
  let priorityScore = 65;
  const immediateActions = [
    'Keep the patient in a safe location and avoid leaving them alone.',
    'Share live location with a trusted contact or responder if available.',
  ];
  let escalationAdvice = 'Seek immediate clinical guidance if symptoms intensify.';

  if (criticalKeywords.some((keyword) => symptomText.includes(keyword))) {
    priority = 'critical';
    priorityScore = 95;
    immediateActions.unshift('Call local emergency services immediately.');
    immediateActions.push('If the person is unresponsive and you are trained, begin first aid or CPR.');
    escalationAdvice = 'This pattern suggests a medical emergency requiring urgent in-person intervention.';
  } else if (highPriorityKeywords.some((keyword) => symptomText.includes(keyword))) {
    priority = 'high';
    priorityScore = 82;
    immediateActions.unshift('Arrange urgent transport to the nearest emergency department.');
    escalationAdvice = 'Urgent evaluation is strongly recommended based on the reported emergency details.';
  }

  return {
    priority,
    priorityScore,
    immediateActions,
    escalationAdvice,
    contactsNotified: [...new Set(contacts)],
  };
};

module.exports = {
  assessEmergency,
};
