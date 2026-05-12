import json
import base64
import io
from rembg import remove
from PIL import Image

def handler(event, context):
    """
    AWS Lambda handler for background removal

    Input (JSON):
    {
        "image": "base64-encoded image data"
    }

    Output (JSON):
    {
        "success": true,
        "image": "base64-encoded processed image",
        "error": null
    }
    """
    try:
        # Parse input
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event

        # Get base64 image
        image_base64 = body.get('image')
        if not image_base64:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': 'Missing image data'
                })
            }

        # Decode base64 to bytes
        image_bytes = base64.b64decode(image_base64)

        # Open image
        input_image = Image.open(io.BytesIO(image_bytes))

        # Remove background
        output_image = remove(input_image)

        # Convert to bytes (PNG to preserve transparency)
        output_buffer = io.BytesIO()
        output_image.save(output_buffer, format='PNG')
        output_bytes = output_buffer.getvalue()

        # Encode to base64
        output_base64 = base64.b64encode(output_bytes).decode('utf-8')

        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'image': output_base64,
                'error': None
            })
        }

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
