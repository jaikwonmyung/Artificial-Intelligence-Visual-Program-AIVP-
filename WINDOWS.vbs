Set WshShell = CreateObject("WScript.Shell") 
' The "0" at the end means run hidden
WshShell.Run chr(34) & "app\core.bat" & chr(34), 0
Set WshShell = Nothing
