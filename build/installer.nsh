; Asks for anonymous data sharing consent via a simple Yes/No dialog during install.
; Preference is written to %APPDATA%\AzeronOverlay\prefs.json so the app can read it.

!macro customInstall
  MessageBox MB_YESNO|MB_ICONQUESTION "Help improve Azeron Overlay!$\n$\nShare anonymous calibration data to help build a library of supported device configurations?$\n$\nNo personal information or key names are collected. You can change this at any time in the app settings." IDNO shareNo
    CreateDirectory "$APPDATA\AzeronOverlay"
    FileOpen $0 "$APPDATA\AzeronOverlay\prefs.json" w
    FileWrite $0 '{"shareAnonymousData":true}'
    FileClose $0
    Goto shareDone
  shareNo:
    CreateDirectory "$APPDATA\AzeronOverlay"
    FileOpen $0 "$APPDATA\AzeronOverlay\prefs.json" w
    FileWrite $0 '{"shareAnonymousData":false}'
    FileClose $0
  shareDone:
!macroend
