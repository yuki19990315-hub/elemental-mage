package jp.elementalmage.app;

import android.app.Activity;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;

/**
 * Offline WebView host for the Elemental Mage browser prototype.
 *
 * The appassets.androidplatform.net URL is intercepted locally and served
 * entirely from the APK. No remote server, credentials or network API needed.
 * Avoid file:// so fetch('../data/*.json') and localStorage work normally.
 */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String PREFIX = "/assets/";
    private static final String START_URL = "https://" + HOST + PREFIX + "prototype/index.html";
    private WebView webView;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                             WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().setNavigationBarColor(Color.rgb(17, 11, 34));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(17, 11, 34));
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);        // required for the game engine
        settings.setDomStorageEnabled(true);        // used only for display settings
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setDefaultTextEncodingName("UTF-8");
        settings.setMediaPlaybackRequiresUserGesture(true);
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!HOST.equals(uri.getHost()) || !"https".equals(uri.getScheme())) return null;
                final String path = uri.getPath();
                if (path == null || !path.startsWith(PREFIX)) return response404();
                String relative = path.substring(PREFIX.length());
                if (relative.isEmpty() || relative.contains("..") || relative.startsWith("/")) return response404();
                try {
                    InputStream data = getAssets().open(relative);
                    return new WebResourceResponse(mime(relative), "UTF-8", 200,
                            "OK", Collections.singletonMap("Access-Control-Allow-Origin", "*"), data);
                } catch (IOException ignored) { return response404(); }
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                return !("https".equals(uri.getScheme()) &&
                         HOST.equals(uri.getHost()) &&
                         uri.getPath() != null &&
                         uri.getPath().startsWith(PREFIX));
            }
        });
        setContentView(webView);
        webView.loadUrl(START_URL);
    }

    private static WebResourceResponse response404() {
        return new WebResourceResponse("text/plain", "UTF-8", 404,
                "Not Found", Collections.emptyMap(),
                new java.io.ByteArrayInputStream(new byte[0]));
    }

    private static String mime(String p) {
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js")) return "text/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        return "application/octet-stream";
    }

    @Override protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override public void onBackPressed() {
        if (webView == null) { super.onBackPressed(); return; }
        webView.evaluateJavascript("(document.querySelector('.nav-tab.active')||{}).dataset?.go||''", value -> {
            if ("\"home\"".equals(value)) finish();
            else webView.evaluateJavascript("(document.querySelector('.nav-tab[data-go=home]')||{}).click?.()", null);
        });
    }

    @Override protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
