import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PlaceResult {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').trim();
    const latParam = searchParams.get('lat') || '22.57';
    const lngParam = searchParams.get('lng') || '88.36';

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: PlaceResult[] = [];

    // 1. Try Photon Komoot API with location bias near user
    try {
      const photonRes = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${latParam}&lon=${lngParam}&limit=8&lang=en`,
        { headers: { 'User-Agent': 'RepireoApp/1.0 (info@repireo.com)' } }
      );

      if (photonRes.ok) {
        const data = await photonRes.json();
        if (Array.isArray(data.features)) {
          for (let i = 0; i < data.features.length; i++) {
            const f = data.features[i];
            const p = f.properties || {};
            const coords = f.geometry?.coordinates;
            if (coords && coords.length >= 2) {
              const title = p.name || p.street || p.city || query;
              const subtitleParts = [
                p.street && p.street !== title ? p.street : null,
                p.district || p.suburb || p.county,
                p.city && p.city !== title ? p.city : null,
                p.state,
                p.postcode,
                p.country,
              ].filter(Boolean);

              results.push({
                id: `photon-${f.properties.osm_id || i}`,
                title,
                subtitle: subtitleParts.join(', '),
                lat: coords[1],
                lng: coords[0],
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('Photon places search error:', err);
    }

    // Prioritize Indian results first
    results.sort((a, b) => {
      const aIn = a.subtitle.toLowerCase().includes('india') ? 0 : 1;
      const bIn = b.subtitle.toLowerCase().includes('india') ? 0 : 1;
      return aIn - bIn;
    });

    // 2. Fallback to OpenStreetMap Nominatim if Photon returned fewer than 2 results
    if (results.length < 2) {
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=in`,
          { headers: { 'User-Agent': 'RepireoApp/1.0 (info@repireo.com)' } }
        );

        if (nomRes.ok) {
          const nomData = await nomRes.json();
          if (Array.isArray(nomData)) {
            for (const item of nomData) {
              const nameParts = (item.display_name || '').split(',');
              const title = nameParts[0]?.trim() || query;
              const subtitle = nameParts.slice(1).join(',').trim();

              // Avoid duplicate lat/lng
              const lat = parseFloat(item.lat);
              const lng = parseFloat(item.lon);
              const alreadyExists = results.some(
                (r) => Math.abs(r.lat - lat) < 0.001 && Math.abs(r.lng - lng) < 0.001
              );

              if (!alreadyExists) {
                results.push({
                  id: `nom-${item.place_id}`,
                  title,
                  subtitle,
                  lat,
                  lng,
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('Nominatim fallback places search error:', err);
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Places search API error:', error);
    return NextResponse.json({ results: [], error: error.message }, { status: 500 });
  }
}
