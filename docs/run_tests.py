import http.server
import socketserver
import json
import subprocess
import sys
import os
import time
import threading

PORT = 8080
RESULTS_FILE = "/Users/ramathehill/CineMood/.agents/challenger_milestone_1_2/test_results.json"
test_completed = threading.Event()

class TestServerHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/report_results':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            results = json.loads(post_data.decode('utf-8'))
            
            # Write results to file
            with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            
            # Respond to client
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
            
            # Signal completion
            test_completed.set()
        else:
            self.send_response(404)
            self.end_headers()

def run_server(server):
    server.serve_forever()

def main():
    # Start server
    handler = TestServerHandler
    # Bind to 127.0.0.1
    server = socketserver.TCPServer(("127.0.0.1", PORT), handler)
    
    # Run server in background thread
    server_thread = threading.Thread(target=run_server, args=(server,))
    server_thread.daemon = True
    server_thread.start()
    print(f"Server started on http://127.0.0.1:{PORT}")
    
    # Run Chrome headless
    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    chrome_cmd = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        f"http://127.0.0.1:{PORT}/test_carousel.html"
    ]
    
    print(f"Launching Chrome: {' '.join(chrome_cmd)}")
    chrome_process = subprocess.Popen(chrome_cmd)
    
    # Wait for test to complete (timeout of 15 seconds)
    success = test_completed.wait(timeout=15)
    
    # Terminate Chrome
    chrome_process.terminate()
    try:
        chrome_process.wait(timeout=2)
    except subprocess.TimeoutExpired:
        chrome_process.kill()
        
    # Shutdown server
    server.shutdown()
    server.server_close()
    
    if not success:
        print("Error: Tests timed out!")
        sys.exit(1)
        
    # Read and print results
    if os.path.exists(RESULTS_FILE):
        with open(RESULTS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print("\n=== TEST RESULTS ===")
        all_passed = True
        for res in data.get("results", []):
            status = res.get("status")
            desc = res.get("desc")
            print(f"[{status}] {desc}")
            if status != "PASS":
                all_passed = False
        print("====================")
        
        print("\n=== BROWSER LOGS ===")
        for log in data.get("logs", []):
            print(log)
        print("====================")
        
        if not all_passed:
            sys.exit(1)
    else:
        print("Error: Results file not found.")
        sys.exit(1)

if __name__ == '__main__':
    # Make sure we are in the correct directory to serve files
    os.chdir("/Users/ramathehill/CineMood/cinemood")
    main()
