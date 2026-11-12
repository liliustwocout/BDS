import { NextRequest, NextResponse } from 'next/server';
import { DEMO_PROPERTIES } from '@/data/demoProperties';
import {
  calculateBudgetSummary,
  generateLayoutPresets,
  generateLocationBIReport,
  parseNaturalLanguageQuery,
  scorePropertyForIntent,
} from '@/lib/aiEngine';
import { BusinessType, DesignStyle } from '@/types';

export async function GET() {
  return NextResponse.json({
    service: 'SpaceVision AI Engine',
    status: 'operational',
    provenancePolicy:
      'Transparent separation between Verified POI Data, Demo Property Models, AI Estimates, and User Input.',
    propertiesCount: DEMO_PROPERTIES.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action || 'search';

    if (action === 'search') {
      const query: string = body?.query || '';
      const businessType: BusinessType = body?.businessType || 'coffee_shop';
      const intent = parseNaturalLanguageQuery(query);
      const effectiveBusiness = intent.detectedBusiness || businessType;

      const ranked = DEMO_PROPERTIES.map((property) => ({
        propertyId: property.id,
        code: property.code,
        title: property.title,
        district: property.district,
        match: scorePropertyForIntent(property, intent, effectiveBusiness),
      })).sort((a, b) => b.match.overallScore - a.match.overallScore);

      return NextResponse.json({
        intent,
        ranked,
        provenance: 'ai_estimate',
      });
    }

    if (action === 'location_bi') {
      const propertyId: string = body?.propertyId || DEMO_PROPERTIES[0].id;
      const businessType: BusinessType = body?.businessType || 'coffee_shop';
      const property =
        DEMO_PROPERTIES.find((p) => p.id === propertyId) || DEMO_PROPERTIES[0];

      const report = generateLocationBIReport(property, businessType);
      return NextResponse.json({
        report,
        provenance: 'ai_estimate',
      });
    }

    if (action === 'studio_presets') {
      const propertyId: string = body?.propertyId || DEMO_PROPERTIES[0].id;
      const businessType: BusinessType = body?.businessType || 'coffee_shop';
      const style: DesignStyle = body?.style || 'scandinavian';
      const property =
        DEMO_PROPERTIES.find((p) => p.id === propertyId) || DEMO_PROPERTIES[0];

      const presets = generateLayoutPresets(property, businessType, style);
      const budget = calculateBudgetSummary(
        property,
        businessType,
        style,
        presets[0]?.items || []
      );

      return NextResponse.json({
        presets,
        budget,
        provenance: 'ai_estimate',
      });
    }

    return NextResponse.json(
      { error: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Failed to process SpaceVision AI request',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
