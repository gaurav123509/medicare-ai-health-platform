const emergencyResponders = require('../data/emergencyResponders');
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

const EARTH_RADIUS_KM = 6371;
const NOMINATIM_API_URL = process.env.OSM_NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search';
const OVERPASS_API_URLS = [
  process.env.OSM_OVERPASS_URL,
  'https://overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
].filter(Boolean);
const LIVE_SEARCH_RADII_METERS = [1500, 3000, 7000, 15000];

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const calculateDistanceKm = (from, to) => {
  if (
    typeof from?.latitude !== 'number'
    || typeof from?.longitude !== 'number'
    || typeof to?.latitude !== 'number'
    || typeof to?.longitude !== 'number'
  ) {
    return null;
  }

  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const startLatitude = toRadians(from.latitude);
  const targetLatitude = toRadians(to.latitude);

  const haversine = (Math.sin(latitudeDelta / 2) ** 2)
    + (Math.cos(startLatitude) * Math.cos(targetLatitude) * (Math.sin(longitudeDelta / 2) ** 2));

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const sanitizePhoneUri = (phone = '') => String(phone).replace(/[^\d+]/g, '');

const buildLocationMapLink = (location = {}) => {
  if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
    return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  }

  if (location.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;
  }

  return '';
};

const buildResponderMapLink = (responder = {}) => {
  if (typeof responder.latitude === 'number' && typeof responder.longitude === 'number') {
    return `https://www.google.com/maps?q=${responder.latitude},${responder.longitude}`;
  }

  const searchText = [responder.name, responder.city].filter(Boolean).join(' ');

  if (!searchText) {
    return '';
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchText)}`;
};

const buildLocationSummary = (location = {}) => {
  const address = String(location.address || '').trim();
  const coordinateText = (
    typeof location.latitude === 'number'
    && typeof location.longitude === 'number'
  )
    ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
    : '';

  return [address, coordinateText].filter(Boolean).join(' | ');
};

const resolveResponderTypeLabel = (type = '') => {
  if (type === 'hospital') {
    return 'Hospital';
  }

  if (type === 'police') {
    return 'Police Station';
  }

  return 'Responder';
};

const formatDistanceLabel = (distanceKm) => {
  if (typeof distanceKm !== 'number') {
    return 'Matched by city';
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km away`;
  }

  return `${Math.round(distanceKm)} km away`;
};

const buildFallbackResponder = (type, addressText = '') => {
  const label = type === 'hospital' ? 'Emergency Hospital Desk' : 'Police Emergency Desk';

  return {
    id: `national-${type}`,
    type,
    name: label,
    city: addressText || 'India',
    phone: '112',
    distanceKm: null,
    matchedBy: addressText ? 'address_fallback' : 'national_fallback',
  };
};

const buildResponderAddress = (tags = {}) => {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ').trim();
  const locality = [
    tags['addr:suburb'],
    tags['addr:neighbourhood'],
    tags['addr:city'],
    tags['addr:town'],
    tags['addr:village'],
    tags['addr:state'],
  ].filter(Boolean).join(', ');

  const directAddress = String(
    tags['addr:full']
    || tags.address
    || tags['contact:address']
    || tags.description
    || '',
  ).trim();

  return directAddress || [street, locality].filter(Boolean).join(', ');
};

const buildViewbox = (location = {}, radiusMeters = 1500) => {
  const latitudeDelta = radiusMeters / 111320;
  const longitudeDelta = radiusMeters / (111320 * Math.max(Math.cos(toRadians(location.latitude || 0)), 0.2));

  return {
    left: location.longitude - longitudeDelta,
    top: location.latitude + latitudeDelta,
    right: location.longitude + longitudeDelta,
    bottom: location.latitude - latitudeDelta,
  };
};

const fetchNearbyNominatimResponders = async ({ type, location, radiusMeters }) => {
  const viewbox = buildViewbox(location, radiusMeters);
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '15',
    bounded: '1',
    viewbox: `${viewbox.left},${viewbox.top},${viewbox.right},${viewbox.bottom}`,
  });

  if (type === 'hospital') {
    params.set('q', 'hospital');
  } else {
    params.set('q', 'police station');
  }

  const response = await fetch(`${NOMINATIM_API_URL}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'MediCare-AI-SOS/1.0 (nearby responder lookup)',
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Nominatim lookup failed: ${response.status} ${errorText}`);
  }

  const items = await response.json();
  const results = Array.isArray(items) ? items : [];

  return results
    .map((item) => {
      const latitude = Number(item.lat);
      const longitude = Number(item.lon);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return null;
      }

      const name = String(item.name || item.display_name || '').split(',')[0].trim()
        || (type === 'hospital' ? 'Nearby Hospital' : 'Nearby Police Station');

      return {
        id: `nominatim-${type}-${item.osm_type}-${item.osm_id}`,
        type,
        name,
        city: String(item.address?.city || item.address?.town || item.address?.village || '').trim(),
        address: String(item.display_name || '').trim(),
        phone: '',
        latitude,
        longitude,
        distanceKm: calculateDistanceKm(location, { latitude, longitude }),
        matchedBy: `live_nominatim_${radiusMeters}m`,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      const leftDistance = typeof left.distanceKm === 'number' ? left.distanceKm : Number.POSITIVE_INFINITY;
      const rightDistance = typeof right.distanceKm === 'number' ? right.distanceKm : Number.POSITIVE_INFINITY;
      return leftDistance - rightDistance;
    });
};

const buildOsmQuery = ({ type, location, radiusMeters }) => {
  const tagFilters = type === 'hospital'
    ? [
      ['amenity', 'hospital'],
      ['healthcare', 'hospital'],
    ]
    : [
      ['amenity', 'police'],
    ];

  const filters = tagFilters
    .map(([key, value]) => `nwr["${key}"="${value}"](around:${radiusMeters},${location.latitude},${location.longitude});`)
    .join('\n');

  return `
[out:json][timeout:12];
(
  ${filters}
);
out body center 15;
  `.trim();
};

const fetchNearbyOsmResponders = async ({ type, location, radiusMeters }) => {
  let lastError = null;

  for (const endpoint of OVERPASS_API_URLS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'text/plain;charset=UTF-8',
          'User-Agent': 'MediCare-AI-SOS/1.0 (nearby responder lookup)',
        },
        body: buildOsmQuery({ type, location, radiusMeters }),
        signal: AbortSignal.timeout(12000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Overpass lookup failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const elements = Array.isArray(data?.elements) ? data.elements : [];

      return elements
        .map((element) => {
          const latitude = Number(element.lat ?? element.center?.lat);
          const longitude = Number(element.lon ?? element.center?.lon);

          if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            return null;
          }

          const distanceKm = calculateDistanceKm(location, { latitude, longitude });
          const tags = element.tags || {};
          const address = buildResponderAddress(tags);

          return {
            id: `osm-${type}-${element.type}-${element.id}`,
            type,
            name: String(
              tags.name
              || tags['name:en']
              || (type === 'hospital' ? 'Nearby Hospital' : 'Nearby Police Station'),
            ).trim(),
            city: String(
              tags['addr:city']
              || tags['addr:town']
              || tags['addr:village']
              || tags['addr:suburb']
              || tags['addr:state']
              || '',
            ).trim(),
            address,
            phone: String(tags.phone || tags['contact:phone'] || tags['phone:emergency'] || '').trim(),
            latitude,
            longitude,
            distanceKm,
            matchedBy: 'live_osm',
          };
        })
        .filter(Boolean)
        .sort((left, right) => {
          const leftDistance = typeof left.distanceKm === 'number' ? left.distanceKm : Number.POSITIVE_INFINITY;
          const rightDistance = typeof right.distanceKm === 'number' ? right.distanceKm : Number.POSITIVE_INFINITY;
          return leftDistance - rightDistance;
        });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Overpass lookup failed without a specific error');
};

const resolveLiveResponder = async (type, location) => {
  for (const radiusMeters of LIVE_SEARCH_RADII_METERS) {
    try {
      const nominatimCandidates = await fetchNearbyNominatimResponders({
        type,
        location,
        radiusMeters,
      });

      if (nominatimCandidates.length > 0) {
        return nominatimCandidates[0];
      }
    } catch (error) {
      console.error(`[emergency] nominatim nearby lookup failed for ${type}: ${error.message}`);
    }

    const candidates = await fetchNearbyOsmResponders({
      type,
      location,
      radiusMeters,
    });

    if (candidates.length > 0) {
      return {
        ...candidates[0],
        matchedBy: `live_osm_${radiusMeters}m`,
      };
    }
  }

  return null;
};

const resolveFallbackResponders = (location = {}) => {
  const addressText = String(location.address || '').trim().toLowerCase();
  const hasCoordinates = (
    typeof location.latitude === 'number'
    && typeof location.longitude === 'number'
  );

  return ['hospital', 'police'].map((type) => {
    let candidates = emergencyResponders.filter((responder) => responder.type === type);

    const addressMatches = addressText
      ? candidates.filter((responder) => responder.keywords.some((keyword) => addressText.includes(keyword)))
      : [];

    if (addressMatches.length > 0) {
      candidates = addressMatches;
    }

    if (!hasCoordinates) {
      return candidates[0]
        ? {
          ...candidates[0],
          distanceKm: null,
          matchedBy: addressMatches.length > 0 ? 'address' : 'directory_fallback',
        }
        : buildFallbackResponder(type, addressText);
    }

    const rankedCandidates = candidates
      .map((candidate) => ({
        ...candidate,
        distanceKm: calculateDistanceKm(location, candidate),
        matchedBy: addressMatches.length > 0 ? 'address_and_location' : 'live_location',
      }))
      .filter((candidate) => typeof candidate.distanceKm === 'number')
      .sort((left, right) => left.distanceKm - right.distanceKm);

    return rankedCandidates[0] || buildFallbackResponder(type, addressText);
  });
};

const resolveResponders = async (location = {}) => {
  const hasCoordinates = (
    typeof location.latitude === 'number'
    && typeof location.longitude === 'number'
  );

  if (hasCoordinates) {
    const fallbackResponders = resolveFallbackResponders(location);

    try {
      const liveResponders = await Promise.all([
        resolveLiveResponder('hospital', location),
        resolveLiveResponder('police', location),
      ]);

      return liveResponders.map((responder, index) => responder || fallbackResponders[index]);
    } catch (error) {
      console.error(`[emergency] live nearby responder lookup failed: ${error.message}`);
    }
  }

  return resolveFallbackResponders(location);
};

const buildResponderAlert = ({
  responder,
  payload,
  user,
  assessment,
  contactNumber,
  locationSummary,
  locationMapLink,
}) => {
  const isLiveNearbyMatch = String(responder.matchedBy || '').startsWith('live_');
  const alertMessage = [
    'MediCare AI SOS alert',
    `Patient: ${user?.name || 'Patient'}`,
    `Emergency: ${payload.emergencyType}`,
    payload.message ? `Message: ${payload.message}` : '',
    payload.symptoms?.length ? `Symptoms: ${payload.symptoms.join(', ')}` : '',
    contactNumber ? `Contact: ${contactNumber}` : '',
    locationSummary ? `Location: ${locationSummary}` : '',
    locationMapLink ? `Map: ${locationMapLink}` : '',
    `Priority: ${String(assessment.priority || 'high').toUpperCase()} (${assessment.priorityScore}/100)`,
  ].filter(Boolean).join(' | ');

  return {
    responderId: responder.id,
    responderType: responder.type,
    responderTypeLabel: resolveResponderTypeLabel(responder.type),
    name: responder.name,
    city: responder.city,
    address: responder.address || '',
    phone: responder.phone,
    latitude: typeof responder.latitude === 'number' ? responder.latitude : null,
    longitude: typeof responder.longitude === 'number' ? responder.longitude : null,
    distanceKm: typeof responder.distanceKm === 'number'
      ? Number(responder.distanceKm.toFixed(1))
      : null,
    distanceLabel: formatDistanceLabel(responder.distanceKm),
    matchedBy: responder.matchedBy,
    status: 'queued',
    channel: 'dispatch_queue',
    queueNote: isLiveNearbyMatch
      ? 'Matched from a live nearby location search around your current coordinates. External responder APIs are not configured, so use the map and contact actions for immediate outreach.'
      : 'External responder APIs are not configured, so this SOS is queued with live location and one-tap contact details for immediate follow-up.',
    locationMapLink,
    responderMapLink: buildResponderMapLink(responder),
    callLink: responder.phone ? `tel:${sanitizePhoneUri(responder.phone)}` : '',
    smsLink: responder.phone ? `sms:${sanitizePhoneUri(responder.phone)}?body=${encodeURIComponent(alertMessage)}` : '',
    alertMessage,
  };
};

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

  const locationSummary = buildLocationSummary(payload.location);
  const locationMapLink = buildLocationMapLink(payload.location);
  const matchedResponders = await resolveResponders(payload.location);
  const responderAlerts = matchedResponders.map((responder) => buildResponderAlert({
    responder,
    payload,
    user,
    assessment: {
      priority,
      priorityScore,
    },
    contactNumber: payload.contactNumber,
    locationSummary,
    locationMapLink,
  }));

  responderAlerts.forEach((alert) => {
    immediateActions.push(
      `Dispatch queue prepared for ${alert.responderTypeLabel.toLowerCase()}: ${alert.name}${alert.phone ? ` (${alert.phone})` : ''}.`,
    );
  });

  if (locationMapLink) {
    immediateActions.push('Keep your phone reachable and share the live map link with responders if they call back.');
  }

  const normalizedActions = [...new Set(immediateActions)];
  const responderSummary = responderAlerts.length > 0
    ? `${responderAlerts.length} responder alerts queued with live location details.`
    : 'No responder directory match was available.';

  return {
    priority,
    priorityScore,
    immediateActions: normalizedActions,
    escalationAdvice,
    contactsNotified: [...new Set(contacts)],
    responderSummary,
    responderAlerts,
    shareableLocation: locationSummary,
    locationMapLink,
  };
};

module.exports = {
  assessEmergency,
};
