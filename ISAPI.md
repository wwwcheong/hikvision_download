這是一份整理好的 **Hikvision ISAPI 開發技術規範 (Markdown)**。您可以直接將此文檔複製並提供給 Gemini CLI (或其他 AI Coding Agent)，作為開發 NVR 錄像下載工具的 Context（上下文）指令。

此文檔涵蓋了標準的 ISAPI 協議細節，特別針對「搜尋」與「下載」流程進行了規範。

---

# Hikvision ISAPI 開發規範：NVR 錄像搜尋與下載

本文件旨在指導開發自動化工具，用於通過 Hikvision ISAPI 介面從 NVR 設備批量下載錄像。

## 1. 基礎協議與認證 (Authentication)

Hikvision 設備主要使用 **HTTP Digest Authentication** (摘要認證)，而非 Basic Auth。

* **Base URL**: `http://<NVR_IP>`
* **認證方式**: HTTP Digest Auth (RFC 2617)
* **建議庫**:
* Python: `requests.auth.HTTPDigestAuth`
* cURL: `--digest -u user:pass`



### 連接測試端點

在開始複雜操作前，建議先呼叫以下端點確認連線與權限：

* **GET** `/ISAPI/System/deviceInfo`
* **預期回應**: HTTP 200 OK 及 XML 格式的設備資訊。

---

## 2. 搜尋錄像檔案 (Search Recordings)

使用 `CMSearchDescription` XML 結構來查詢指定時間範圍內的錄像片段。

### 請求詳情

* **Method**: `POST`
* **Endpoint**: `/ISAPI/ContentMgmt/search`
* **Headers**: `Content-Type: application/xml`

### 請求 Body (XML 範本)

AI 應動態生成此 XML，並替換 `{{變數}}`：

```xml
<?xml version="1.0" encoding="utf-8"?>
<CMSearchDescription>
    <searchID>{{UUID}}</searchID> <trackList>
        <trackID>{{Channel_ID}}</trackID> </trackList>
    <timeSpanList>
        <timeSpan>
            <startTime>{{YYYY-MM-DDThh:mm:ssZ}}</startTime>
            <endTime>{{YYYY-MM-DDThh:mm:ssZ}}</endTime>
        </timeSpan>
    </timeSpanList>
    <maxResults>100</maxResults> <searchResultPostion>0</searchResultPostion>
    <metadataList>
        <metadataDescriptor>//recordType.meta.std-cgi.com</metadataDescriptor>
    </metadataList>
</CMSearchDescription>

```

### 回應解析 (Response Parsing)

成功回應 (HTTP 200) 將包含 `<CMSearchResult>`。

* **關鍵路徑**: `CMSearchResult` -> `matchList` -> `searchMatchItem`
* **需提取欄位**:
1. `mediaSegmentDescriptor` -> `playbackURI` (下載所需的關鍵 URL)
2. `mediaSegmentDescriptor` -> `startTime` / `endTime` (用於檔案命名)



**注意**: 若無錄像，`matchList` 可能為空或不存在，需做好異常處理。

---

## 3. 下載錄像檔案 (Download Recordings)

下載是透過搜尋結果中獲得的 `playbackURI` 進行的。

### 請求詳情

* **Method**: `GET`
* **Endpoint**: `/ISAPI/ContentMgmt/download`
* **參數**: `playbackURI` (從搜尋步驟獲取)

**重要**: `playbackURI` 通常包含 RTSP 格式的字串，但在 HTTP 下載請求中，應將其作為查詢參數傳遞。

### URL 構建邏輯

假設搜尋到的 `playbackURI` 為：
`rtsp://192.168.1.100/Streaming/tracks/101?starttime=...&endtime=...`

則下載請求的 URL 應構建為：
`http://<NVR_IP>/ISAPI/ContentMgmt/download?playbackURI=rtsp://<NVR_IP>/Streaming/tracks/101?starttime=...&endtime=...`

*注意：需對 playbackURI 參數進行 URL Encode。*

### 串流處理 (Stream Handling)

* 回應為二進制影像流 (Binary Stream)。
* 開發時應使用 Chunk (分塊) 寫入方式儲存檔案，避免記憶體溢出。
* **檔案命名建議**: `{ChannelID}_{StartTime}_{EndTime}.mp4`

---

## 4. 開發注意事項 (Implementation Notes)

1. **Channel ID 規則**:
* Hikvision NVR 的 `trackID` 通常遵循規則：`Camera_Number * 100 + 1`。
* 例如：Camera 1 = `101`, Camera 2 = `201`, Camera 12 = `1201`。


2. **時間格式**:
* 強烈建議使用 UTC (`Z` 結尾) 格式：`2026-01-28T12:00:00Z`。
* 若 NVR 設定為本地時間，需注意時區轉換問題。


3. **分頁處理**:
* 如果單次搜尋結果超過 `maxResults`，需透過 XML 中的 `searchResultPosition` 進行分頁請求 (也就是 Offset)。


4. **錯誤碼**:
* `401 Unauthorized`: 認證失敗 (檢查 Digest Auth)。
* `403 Forbidden`: 權限不足 (檢查帳號是否有回放/下載權限)。
* `503 Service Unavailable`: NVR 忙碌，建議實作 Retry 機制 (Exponential Backoff)。



---

### 5. 虛擬代碼結構參考 (Python Pseudo-code)

```python
import requests
from requests.auth import HTTPDigestAuth
import uuid

def get_recordings(nvr_ip, user, password, channel, start_time, end_time):
    # 1. Setup Auth
    auth = HTTPDigestAuth(user, password)
    
    # 2. Prepare Search XML
    track_id = channel * 100 + 1
    xml_body = f"""...<trackID>{track_id}</trackID>...""" # 填入上述 XML 模板
    
    # 3. Perform Search
    resp = requests.post(
        f"http://{nvr_ip}/ISAPI/ContentMgmt/search",
        auth=auth,
        data=xml_body
    )
    
    # 4. Parse URI from Response
    # ... (使用 xmltodict 解析) ...
    video_uris = extract_uris(resp.text)
    
    # 5. Download Loop
    for uri in video_uris:
        download_url = f"http://{nvr_ip}/ISAPI/ContentMgmt/download"
        file_resp = requests.get(download_url, auth=auth, params={'playbackURI': uri}, stream=True)
        # ... (寫入檔案) ...

```
