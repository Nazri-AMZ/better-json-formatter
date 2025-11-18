import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { inputText, moliMode } = await request.json();

    // Simple echo for debugging
    console.log('API received:', { inputText, moliMode, inputLength: inputText?.length || 0 });

    return NextResponse.json({
      success: true,
      message: 'Request received',
      receivedData: {
        inputText,
        moliMode,
        inputLength
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API endpoint is ready',
    timestamp: new Date().toISOString()
  });
}