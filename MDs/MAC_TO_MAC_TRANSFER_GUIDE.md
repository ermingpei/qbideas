# Mac-to-Mac File Transfer Guide (Same Subnet)

Complete guide for transferring files between two Macs on the same local network.

## 🚀 Quick Comparison

| Method | Speed | Setup | Size Limit | Best For |
|--------|-------|-------|------------|----------|
| **AirDrop** | ⚡⚡⚡ Fast | None | None | Small-medium files |
| **HTTP Server** | ⚡⚡ Medium | 1 command | None | Any size, simple |
| **SCP/SFTP** | ⚡⚡⚡ Fast | Enable SSH | None | Large files, secure |
| **Shared Folder** | ⚡⚡⚡ Fast | Enable sharing | None | Multiple transfers |
| **rsync** | ⚡⚡⚡ Fast | Enable SSH | None | Large/many files |

## Method 1: AirDrop (Easiest)

### Setup
No setup needed! Works out of the box.

### Steps

**On BOTH Macs:**
1. Open Finder
2. Go to **AirDrop** in sidebar (or press `Cmd+Shift+R`)
3. Set "Allow me to be discovered by" to **Everyone**

**On OLD Mac:**
1. Drag and drop files to the new Mac's icon in AirDrop
2. Wait for transfer to complete

**On NEW Mac:**
1. Accept the incoming files
2. Files appear in Downloads folder

### Pros & Cons
✅ No setup required  
✅ Very easy to use  
✅ Works wirelessly  
❌ Can be slow for large files  
❌ Sometimes unreliable  
❌ Must drag files individually or in folders  

### Best For
- Quick transfers
- Files under 1GB
- When you don't want to use terminal

---

## Method 2: Python HTTP Server (Recommended for Migration)

### Why This Method?
- Simple one-command setup
- Fast on local network
- Works with any file size
- Easy to verify transfer
- Already included in our migration script!

### Steps

**On OLD Mac:**

1. **Navigate to project directory**
   ```bash
   cd /path/to/qbideas
   ```

2. **Start HTTP server**
   ```bash
   python3 -m http.server 8080
   ```
   
   You'll see:
   ```
   Serving HTTP on :: port 8080 (http://[::]:8080/) ...
   ```

3. **Find your IP address**
   ```bash
   # In a new terminal
   ipconfig getifaddr en0
   # Or if that doesn't work:
   ipconfig getifaddr en1
   ```
   
   Example output: `192.168.1.100`

4. **Share the URL with new Mac**
   ```
   http://192.168.1.100:8080
   ```

**On NEW Mac:**

**Option A: Download via Browser**
1. Open browser
2. Go to `http://OLD_MAC_IP:8080`
3. Click on files to download
4. Files go to Downloads folder

**Option B: Download via Terminal (Better for large files)**
```bash
# Download single file
curl -O http://192.168.1.100:8080/qbideas-migration.tar.gz

# Download with progress bar
curl -# -O http://192.168.1.100:8080/qbideas-migration.tar.gz

# Download to specific location
curl -o ~/Desktop/migration.tar.gz http://192.168.1.100:8080/qbideas-migration.tar.gz

# Download multiple files
curl -O http://192.168.1.100:8080/file1.tar.gz \
     -O http://192.168.1.100:8080/file2.sql
```

**Option C: Download entire directory**
```bash
# Using wget (install first: brew install wget)
wget -r -np -nH --cut-dirs=0 http://192.168.1.100:8080/
```

### Verify Transfer
```bash
# On NEW Mac - check file size matches
ls -lh qbideas-migration.tar.gz

# Compare with OLD Mac
# On OLD Mac:
ls -lh qbideas-migration.tar.gz

# Or verify checksum
# On OLD Mac:
shasum -a 256 qbideas-migration.tar.gz

# On NEW Mac:
shasum -a 256 qbideas-migration.tar.gz
# Checksums should match!
```

### Stop Server
On OLD Mac, press `Ctrl+C` to stop the server.

### Pros & Cons
✅ Very simple (one command)  
✅ Fast on local network  
✅ Works with any file size  
✅ Easy to verify  
✅ Can download from browser or terminal  
❌ No encryption (but safe on local network)  
❌ Must keep terminal open  

### Best For
- Migration packages
- Large files
- Multiple file downloads
- When you're comfortable with terminal

---

## Method 3: SCP (Secure Copy) - Fastest & Most Reliable

### Setup

**On OLD Mac (one-time setup):**

1. **Enable Remote Login**
   ```bash
   # Via System Settings
   System Settings → General → Sharing → Remote Login → ON
   
   # Or via terminal
   sudo systemsetup -setremotelogin on
   ```

2. **Find your username**
   ```bash
   whoami
   ```
   Example: `john`

3. **Find your IP address**
   ```bash
   ipconfig getifaddr en0
   ```
   Example: `192.168.1.100`

### Transfer Files

**On NEW Mac:**

**Copy single file:**
```bash
scp username@192.168.1.100:/path/to/file.tar.gz ~/Desktop/
```

**Copy entire directory:**
```bash
scp -r username@192.168.1.100:/path/to/qbideas ~/Desktop/
```

**Copy migration package:**
```bash
scp username@192.168.1.100:/path/to/qbideas/qbideas-migration.tar.gz ~/Downloads/
```

**Copy with progress:**
```bash
# Install rsync if not available
brew install rsync

# Copy with progress
rsync -avh --progress username@192.168.1.100:/path/to/file.tar.gz ~/Desktop/
```

### Real Example

```bash
# OLD Mac IP: 192.168.1.100
# OLD Mac username: john
# File location: /Users/john/qbideas/qbideas-migration.tar.gz

# On NEW Mac:
scp john@192.168.1.100:/Users/john/qbideas/qbideas-migration.tar.gz ~/Downloads/

# Enter password when prompted
# Transfer begins with progress indicator
```

### Pros & Cons
✅ Very fast  
✅ Secure (encrypted)  
✅ Reliable  
✅ Shows progress  
✅ Can resume interrupted transfers (with rsync)  
❌ Requires SSH setup  
❌ Need to know exact file paths  
❌ Must enter password (unless using SSH keys)  

### Best For
- Large files
- Entire directories
- When you need security
- Repeated transfers

---

## Method 4: Shared Folder (Best for Multiple Transfers)

### Setup

**On OLD Mac:**

1. **Enable File Sharing**
   ```
   System Settings → General → Sharing → File Sharing → ON
   ```

2. **Add shared folder**
   - Click the `+` button under Shared Folders
   - Select your project folder (e.g., qbideas)
   - Set permissions: Everyone → Read Only

3. **Note your computer name**
   ```
   System Settings → General → Sharing → Computer Name
   ```
   Example: `Johns-MacBook-Pro`

4. **Find your IP**
   ```bash
   ipconfig getifaddr en0
   ```

### Connect from NEW Mac

**Option A: Via Finder**
1. Open Finder
2. Press `Cmd+K` (or Go → Connect to Server)
3. Enter: `smb://192.168.1.100`
4. Click Connect
5. Enter username and password
6. Select the shared folder
7. Copy files as needed

**Option B: Via Terminal**
```bash
# Mount the share
mkdir ~/old-mac
mount -t smbfs //username@192.168.1.100/qbideas ~/old-mac

# Copy files
cp -r ~/old-mac/qbideas-migration.tar.gz ~/Downloads/

# Unmount when done
umount ~/old-mac
```

### Pros & Cons
✅ Easy to browse files  
✅ Good for multiple transfers  
✅ Can access anytime  
✅ Native macOS integration  
❌ Requires setup  
❌ Slower than SCP  
❌ Must keep sharing enabled  

### Best For
- Multiple file transfers
- Browsing files before copying
- Non-technical users
- Ongoing access needed

---

## Method 5: rsync (Best for Large Projects)

### Setup
Requires SSH enabled on OLD Mac (see Method 3).

### Basic Usage

**Sync entire project:**
```bash
rsync -avh --progress username@192.168.1.100:/path/to/qbideas/ ~/qbideas/
```

**Sync with exclusions:**
```bash
rsync -avh --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  username@192.168.1.100:/path/to/qbideas/ ~/qbideas/
```

**Dry run (see what would be copied):**
```bash
rsync -avhn --progress username@192.168.1.100:/path/to/qbideas/ ~/qbideas/
```

**Resume interrupted transfer:**
```bash
rsync -avh --progress --partial username@192.168.1.100:/path/to/file.tar.gz ~/Downloads/
```

### Flags Explained
- `-a` = archive mode (preserves permissions, timestamps)
- `-v` = verbose (show files being transferred)
- `-h` = human-readable sizes
- `--progress` = show progress bar
- `-n` = dry run (don't actually copy)
- `--partial` = keep partially transferred files
- `--exclude` = skip certain files/folders

### Pros & Cons
✅ Very fast  
✅ Can resume transfers  
✅ Only copies changed files  
✅ Can exclude files  
✅ Shows detailed progress  
❌ Requires SSH  
❌ More complex syntax  

### Best For
- Very large projects
- Many files
- Resumable transfers
- Syncing (not just copying)

---

## 🎯 Recommended Method for qbideas Migration

### For Same Subnet Migration:

**Best Choice: Python HTTP Server**

Why?
- Simple one-command setup
- Fast enough for migration package
- No configuration needed
- Easy to verify
- Works every time

**Steps:**

1. **On OLD Mac:**
   ```bash
   cd /path/to/qbideas
   ./scripts/transfer-to-new-mac.sh
   # Script will start HTTP server automatically
   ```

2. **On NEW Mac:**
   ```bash
   # Get IP from old Mac terminal output
   curl -O http://OLD_MAC_IP:8080/qbideas-migration.tar.gz
   
   # Verify download
   ls -lh qbideas-migration.tar.gz
   
   # Extract and setup
   tar xzf qbideas-migration.tar.gz
   cd qbideas-migration
   ./setup-on-new-mac.sh
   ```

---

## 🔧 Troubleshooting

### Can't Find IP Address

```bash
# Try all network interfaces
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or use this
ipconfig getifaddr en0  # WiFi usually
ipconfig getifaddr en1  # Ethernet usually
```

### Connection Refused

**For HTTP Server:**
```bash
# Check if server is running
lsof -i :8080

# Check firewall
System Settings → Network → Firewall → Turn Off (temporarily)
```

**For SSH/SCP:**
```bash
# On OLD Mac - verify SSH is running
sudo systemsetup -getremotelogin

# Should show: Remote Login: On
```

### Slow Transfer Speed

```bash
# Check network connection
ping 192.168.1.100

# Should show low latency (< 5ms on local network)

# Check WiFi vs Ethernet
# Ethernet is faster - use if available
```

### Transfer Interrupted

**For curl:**
```bash
# Resume download
curl -C - -O http://192.168.1.100:8080/file.tar.gz
```

**For rsync:**
```bash
# Automatically resumes
rsync -avh --progress --partial user@ip:/path/to/file ~/Downloads/
```

### File Corruption

```bash
# Verify with checksum
# On OLD Mac:
shasum -a 256 file.tar.gz > checksum.txt

# Transfer checksum.txt too
# On NEW Mac:
shasum -a 256 file.tar.gz
# Compare with checksum.txt
```

---

## 📊 Speed Comparison (Real World)

For a 500MB migration package on same subnet:

| Method | Time | Notes |
|--------|------|-------|
| AirDrop | 3-5 min | Can be unreliable |
| HTTP Server | 1-2 min | Consistent |
| SCP | 1-2 min | Fastest, most reliable |
| Shared Folder | 2-3 min | Good for browsing |
| rsync | 1-2 min | Best for large projects |

**Network speeds:**
- WiFi 5 (802.11ac): ~50-100 MB/s
- WiFi 6: ~100-200 MB/s
- Gigabit Ethernet: ~100-125 MB/s

---

## 🎓 Pro Tips

### 1. Use Ethernet for Large Transfers
```bash
# Much faster and more reliable than WiFi
# Connect both Macs with Ethernet cable or via router
```

### 2. Compress Before Transfer
```bash
# On OLD Mac
tar czf project.tar.gz qbideas/
# Transfer compressed file (much faster)

# On NEW Mac
tar xzf project.tar.gz
```

### 3. Verify Large Transfers
```bash
# Always verify large files
shasum -a 256 file.tar.gz
```

### 4. Keep Both Macs Awake
```bash
# On OLD Mac (prevent sleep during transfer)
caffeinate -s python3 -m http.server 8080

# Or in System Settings:
# Battery → Prevent automatic sleeping when display is off
```

### 5. Use Screen/tmux for Long Transfers
```bash
# Start screen session
screen -S transfer

# Start transfer
python3 -m http.server 8080

# Detach: Ctrl+A, then D
# Reattach: screen -r transfer
```

---

## 🔐 Security Notes

### On Local Network
- HTTP server is fine (no encryption needed on trusted network)
- Disable firewall temporarily if needed
- Re-enable after transfer

### On Public Network
- Always use SCP/SFTP (encrypted)
- Never use HTTP server on public WiFi
- Use VPN if possible

---

## 📝 Quick Reference Commands

### Find IP Address
```bash
ipconfig getifaddr en0
```

### Start HTTP Server
```bash
python3 -m http.server 8080
```

### Download File
```bash
curl -O http://IP:8080/file.tar.gz
```

### Copy via SCP
```bash
scp user@IP:/path/file.tar.gz ~/Downloads/
```

### Sync via rsync
```bash
rsync -avh --progress user@IP:/path/ ~/destination/
```

### Verify Transfer
```bash
shasum -a 256 file.tar.gz
```

---

## ✅ Complete Transfer Workflow

### Using HTTP Server (Recommended)

**On OLD Mac:**
```bash
# 1. Navigate to project
cd ~/qbideas

# 2. Create migration package
./scripts/transfer-to-new-mac.sh

# 3. Note your IP (shown in script output)
# Example: 192.168.1.100

# 4. Server starts automatically
# Keep terminal open
```

**On NEW Mac:**
```bash
# 1. Download package
curl -# -O http://192.168.1.100:8080/qbideas-migration.tar.gz

# 2. Verify size
ls -lh qbideas-migration.tar.gz

# 3. Extract
tar xzf qbideas-migration.tar.gz

# 4. Setup
cd qbideas-migration
./setup-on-new-mac.sh

# 5. Follow prompts
```

**On OLD Mac:**
```bash
# After transfer complete
# Press Ctrl+C to stop server
```

---

## 🎉 Summary

**For qbideas migration, use:**
1. **Python HTTP Server** - Easiest, included in migration script
2. **SCP** - If you need speed and have SSH enabled
3. **AirDrop** - For quick small file transfers

**The migration script handles everything:**
```bash
./scripts/transfer-to-new-mac.sh
```

Just follow the prompts and you're done! 🚀
