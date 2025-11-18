// Debug the JSON parsing issue
const testJson = '{"level":"INFO","message":"Request","sampling_rate":0,"service":"HttpClientForDTE2","timestamp":"2025-11-18T05:59:57.252Z","xray_trace_id":"1-691c0b5d-2f53e980022e584f779e04f4","globalContext":{"clientId":"190sth074afcel3hm124hi2r7m","clientName":"undefined","controller":"GetSubscriberHttpController"},"payload":{"baseUrl":"https://uatpp.api.nonprod.dte.aws.celcomdigi.com","headers":{"Accept":"application/json, text/plain, */*","Content-Type":"application/json","X-Request-Id":"20251118135957522746","Authorization":"Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJPQ1lINHFqaURmcUxMWnk0ZWQwaW1TX0RrSFhRWFBHcW5zTGNQMUhrUHZNIn0.eyJleHAiOjE3NjM0NDczODYsImlhdCI6MTc2MzQ0NTU4NiwianRpIjoidHJydGNjOmRiMDUxYmIyLWQzNDgtNDMxYS1hMWEzLWM5YmRmODBlYzNiZiIsImlzcyI6Imh0dHBzOi8va2V5Y2xvYWsubm9ucHJvZC5kdGUuYXdzLmNlbGNvbWRpZ2kuY29tL3JlYWxtcy9tdy11YXQtcmVhbG0iLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiNDczNzUxMDAtOTkxMS00NmRiLTkxNWItZGYwODRkNDU4N2U5IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoibXctbW9saS11c2VyIiwiYWxsb3dlZC1vcmlnaW5zIjpbIi8qIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJNVy1BRE1JTi1STCIsImRlZmF1bHQtcm9sZXMtbXctdWF0LXJlYWxtIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7Im13LW1vbGktdXNlciI6eyJyb2xlcyI6WyJ1bWFfcHJvdGVjdGlvbiJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIiwiWC1EZWZhdWx0LUJFLUlEIjoiQ2VsY29tRGlnaSIsImNsaWVudEhvc3QiOiIxMDAuNjUuMjUuMjM1IiwiWC1Tb3VyY2UtU3lzdGVtLUlEIjoiTkdTQSIsInByZWZlcnJlZF91c2VybmFtZSI6InNlcnZpY2UtYWNjb3VudC1tdy1tb2xpLXVzZXIiLCJjbGllbnRBZGRyZXNzIjoiMTAwLjY1LjI1LjIzNSIsImNsaWVudF9pZCI6Im13LW1vbGktdXNlciIsIlgtT1AtSUQiOiJDZWxjb21EaWdpIiwiWC1BbGxvd2VkLUJFLUlEIjpbIjEwMDAwNjAwMCIsIjEwMiIsIjExMSIsIkNlbGNvbURpZ2kiLCJQYXZvY29tbXMiXX0.kQcvcsl1cEj_o0GAxXAn8cd5NswxqCBoJVUyRrZ52blaglwFijcQUHDwYlP1m7vT58cDCFZixezd4Ynkt3VUICT8Oo2OpfxiI6TM28M9eVb-0EJN7VFYqJ36Xhzezt9TeOxYLE-fX56MSJ8nfrEsudsvevWX3Y8NuGiqbocjrtW83F9ikpChQK1ipiYud3vDEknbhgg580Rj3Z3j7rH1K58sbWilRuRMaB8ac7q5lH-ptJdu5IJEUyQVhXswVfuthOanIa1RoL3QxDfSwtF4_SccxX0zKcvFfczeDu-kcF5d4XhqdKwNpfHbq-tYCLc4aAx-eEp5xlLttKVTbkmyAQ","X-Op-ID":"CelcomDigi","X-BE-ID":"CelcomDigi","X-Source-System-ID":"NGSA"},"method":"get","params":{"msisdn":"6070200618"},"url":"/mw/customer-management-customer/customermanagement/v4/customer"}}';

console.log('=== DEBUG TEST ===');
console.log('Input JSON length:', testJson.length);
console.log('Position 116 character:', testJson[116]);
console.log('Context around position 116:');
console.log('Before:', JSON.stringify(testJson.substring(105, 130)));
console.log('After :', JSON.stringify(testJson.substring(110, 125)));

// Test the current cleaning logic
let cleanedText = testJson.trim();
cleanedText = cleanedText.replace(/^(request|response)\s+\d+:\s*/i, '');
cleanedText = cleanedText.replace(/^\s*\{\{/, '{').replace(/\}\}\s*$/, '}');

console.log('Cleaned text:', cleanedText);
console.log('Starts with {:', cleanedText.startsWith('{'));
console.log('Ends with }:', cleanedText.endsWith('}'));

try {
  const parsed = JSON.parse(cleanedText);
  console.log('✅ Cleaned JSON parses successfully!');
  console.log('Keys:', Object.keys(parsed));
} catch (error) {
  console.log('❌ Cleaned JSON fails:', error.message);
  console.log('Error position:', error.message.match(/position (\d+)/)?.[1]);
}