;;; ==============================================================================
;;; LAYER & LINETYPE MANAGEMENT SHORTCUTS (L1_L2_L3_Layiso.lsp)
;;; ==============================================================================
;;; Description: Fast shortcut commands for isolating layers, turning layers on/off,
;;;              shifting properties to ByLayer / Defpoints / Layer 0, and editing LTScale.
;;; Language:    AutoLISP / AutoCAD
;;; ==============================================================================

;;; --- 1. Quick Layer Visibility Shortcuts ---
(defun c:L3 ()
  (command "LAYON")
  (princ "\nAll layers turned ON.")
  (princ "\nAutoLISP tool collected and shared for non-profit by iViDLab.com")
  (princ)
)

(defun c:L2 ()
  (command "_.LAYOFF")
  (princ "\nSelected layer turned OFF.")
  (princ "\nAutoLISP tool collected and shared for non-profit by iViDLab.com")
  (princ)
)

(defun c:L1 ()
  (command "_.LAYISO")
  (princ "\nSelected layer ISOLATED.")
  (princ "\nAutoLISP tool collected and shared for non-profit by iViDLab.com")
  (princ)
)

;;; --- 2. Ultra-fast Trim Shortcut ---
(defun c:T ()
  (command "_.TRIM")
  (princ)
)

;;; --- 3. Quick Layer Shifting Utilities ---
;;; Change selected object layer to Layer "0"
(defun c:ts0 (/ ss)
  (setq ss (ssget))
  (if ss
    (progn
      (command "_.CHPROP" ss "" "la" "0" "")
      (princ "\nSelected objects moved to Layer 0.")
    )
    (prompt "\nNo objects selected.")
  )
  (princ "\nAutoLISP tool collected and shared for non-profit by iViDLab.com")
  (princ)
)

;;; Change selected object layer to Layer "Part"
(defun c:tp (/ ss)
  (setq ss (ssget))
  (if ss
    (progn
      (command "_.CHPROP" ss "" "la" "Part" "")
      (princ "\nSelected objects moved to Layer Part.")
    )
    (prompt "\nNo objects selected.")
  )
  (princ "\nAutoLISP tool collected and shared for non-profit by iViDLab.com")
  (princ)
)

;;; Change selected object layer to Layer "Defpoints" (Non-printable)
(defun c:tsd (/ ss)
  (setq ss (ssget))
  (if ss
    (progn
      (command "_.CHPROP" ss "" "la" "Defpoints" "")
      (princ "\nSelected objects moved to Defpoints layer.")
    )
    (prompt "\nNo objects selected.")
  )
  (princ "\nAutoLISP tool collected and shared for non-profit by iViDLab.com")
  (princ)
)

;;; --- 4. ByLayer Standardization Utilities ---
;;; Change selected object color to BYLAYER
(defun c:tscolor (/ ss)
  (setq ss (ssget))
  (if ss
    (progn
      (command "_.CHPROP" ss "" "color" "bylayer" "")
      (princ "\nSelected object colors changed to BYLAYER.")
    )
    (prompt "\nNo objects selected.")
  )
  (princ "\nAutoLISP tool collected and shared for non-profit by iViDLab.com")
  (princ)
)

;;; Change selected object linetype to BYLAYER
(defun c:tslinetype (/ ss)
  (setq ss (ssget))
  (if ss
    (progn
      (command "_.CHPROP" ss "" "ltype" "bylayer" "")
      (princ "\nSelected object linetypes changed to BYLAYER.")
    )
    (prompt "\nNo objects selected.")
  )
  (princ "\nAutoLISP tool collected and shared for non-profit by iViDLab.com")
  (princ)
)

;;; --- 5. Custom Linetype Scale (LTSCALE) Modifier ---
(defun c:LS (/ ss lts)
  (setq ss (ssget))
  (if ss
    (progn
      (setq lts (getreal "\nEnter new Linetype Scale (LTSCALE) value: "))
      (if lts
        (progn
          (command "_.CHPROP" ss "" "ltscale" lts "")
          (princ (strcat "\nLinetype scale changed to " (rtos lts 2 4)))
        )
        (prompt "\nInvalid scale value entered.")
      )
    )
    (prompt "\nNo objects selected.")
  )
  (princ "\nAutoLISP tool collected and shared for non-profit by iViDLab.com")
  (princ)
)

;;; End of Lisp File
(princ "\nL1_L2_L3_Layiso tool set loaded successfully. Type L1, L2, L3, TS0, LS... to execute.")
(princ)
