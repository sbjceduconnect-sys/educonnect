from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from core.response import api_success, api_error

class AILectureSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        text = request.data.get('text', '').strip()
        format_type = request.data.get('format', 'bullet-points')

        if not text:
            return api_error("Text content is required.", status=400)

        # Generate mock content based on format
        if format_type == 'detailed':
            summary = (
                f"# Detailed Lecture Narrative Summary\n\n"
                f"### Core Themes & Overview\n"
                f"The provided lecture content focuses on key conceptual areas, detailing structured workflows "
                f"and architecture design principles. It emphasizes practical implementation steps.\n\n"
                f"### Analysis\n"
                f"Here is a detailed breakdown of the input transcript:\n"
                f"\"{text[:300]}...\"\n\n"
                f"This discussion introduces critical methodologies for real-world deployment, "
                f"ensuring optimal throughput, latency guarantees, and decoupled microservice patterns."
            )
        elif format_type == 'checklist':
            summary = (
                f"# Study Guide Checklist\n\n"
                f"Verify your understanding of these core topics discussed in the lecture:\n\n"
                f"- [ ] **Fundamental Concepts**: Can you explain the main idea of \"{text[:40]}...\"?\n"
                f"- [ ] **Workflow Operations**: Identify key prerequisites for execution.\n"
                f"- [ ] **Troubleshooting & Edge Cases**: Describe common failure modes and error flags.\n"
                f"- [ ] **Performance Benchmarks**: State the latency target metrics."
            )
        else:  # bullet-points
            summary = (
                f"# Key Lecture Bullet Points\n\n"
                f"Here are the high-level takeaways extracted from the transcript:\n\n"
                f"* **Primary Takeaway**: Direct integration and decoupled structures are preferred.\n"
                f"* **Contextual Analysis**: Content references critical parameters like (\"{text[:50]}...\").\n"
                f"* **Best Practices**: Maintain strict validation checks on input parameters.\n"
                f"* **Next Steps**: Review the associated repository implementations and run the connectivity tests."
            )

        return api_success(data={"summary": summary}, message="AI lecture summary generated successfully.")


class AILectureSummaryFileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get('file')
        format_type = request.data.get('format', 'bullet-points')

        if not file_obj:
            return api_error("Transcript file is required.", status=400)

        # Read some text from the uploaded file
        try:
            content = file_obj.read().decode('utf-8', errors='ignore')[:500]
        except Exception:
            content = "[Binary/Unreadable File Content]"

        # Generate mock content based on format
        if format_type == 'detailed':
            summary = (
                f"# Detailed Document Analysis\n\n"
                f"**File Processed**: `{file_obj.name}` ({file_obj.size} bytes)\n\n"
                f"### Summary Overview\n"
                f"The document details critical structural workflows. Here is the parsed preview:\n"
                f"\"{content[:300]}...\"\n\n"
                f"This document is formatted for academic review and provides deep insights into the subject domain."
            )
        elif format_type == 'checklist':
            summary = (
                f"# Study Guide Checklist (from {file_obj.name})\n\n"
                f"Please review the following checklist items from the uploaded transcript:\n\n"
                f"- [ ] Explain the key formulas or descriptions inside: \"{content[:40]}...\"\n"
                f"- [ ] List the primary dependencies described in the file.\n"
                f"- [ ] Review the sample calculations or execution guides.\n"
                f"- [ ] Complete the practice workbook questions."
            )
        else: # bullet-points
            summary = (
                f"# Key Takeaways (from {file_obj.name})\n\n"
                f"* **Processed File**: `{file_obj.name}`\n"
                f"* **Key Point 1**: The uploaded transcript details key performance benchmarks.\n"
                f"* **Key Point 2**: Preview of analyzed text: \"{content[:80]}...\"\n"
                f"* **Key Point 3**: Direct API validation and type correctness are highly stressed.\n"
                f"* **Recommendation**: Build robust unit tests matching these requirements."
            )

        return api_success(data={"summary": summary}, message="AI summary generated from file successfully.")
