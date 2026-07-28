;; BB_Quick_Block_Creator.lsp
;; Quick Block Creator with Automatic Date-Time Naming

(defun c:BB ( / ss basePt blockName userInput defaultName blockExists count dt jd frac totalSec hour min sec dateStr get-valid-selection get-datetime-name ensure-unique-name )

  ;; Helper function to validate selection set
  (defun get-valid-selection ()
    (while (not (setq ss (ssget)))
      (princ "\nNo objects selected. Please select objects again: ")
    )
    ss
  )

  ;; Helper function to generate default YYYYMMDD_HHMMSS block name
  (defun get-datetime-name ( / dt jd frac totalSec hour min sec dateStr )
    (setq jd (fix (getvar "DATE")))
    (setq frac (- (getvar "DATE") jd))
    (setq totalSec (fix (* frac 86400)))
    (setq hour (fix (/ totalSec 3600)))
    (setq min (fix (/ (- totalSec (* hour 3600)) 60)))
    (setq sec (- totalSec (* hour 3600) (* min 60)))
    (setq dateStr (menucmd "M=$(edtime,$(getvar,date),YYYYMMDD)"))
    (strcat dateStr "_" (if (< hour 10) "0" "") (itoa hour)
                        (if (< min 10) "0" "") (itoa min)
                        (if (< sec 10) "0" "") (itoa sec))
  )

  ;; Helper function to ensure unique block name
  (defun ensure-unique-name (name / newName count)
    (setq count 1
          newName name)
    (while (tblsearch "BLOCK" newName)
      (setq newName (strcat name "_" (itoa count)))
      (setq count (1+ count))
    )
    newName
  )

  ;; Main routine
  (get-valid-selection)
  (setq basePt (getpoint "\nSpecify base point for block: "))
  (setq defaultName (get-datetime-name))
  
  ;; getstring with T allows whitespace in block name
  (setq userInput (getstring T (strcat "\nEnter block name <" defaultName ">: ")))
  
  (if (= userInput "")
    (setq blockName defaultName)
    (setq blockName userInput)
  )
  (setq blockName (ensure-unique-name blockName))

  ;; Create block and insert it back at base point
  (command "_.-block" blockName basePt ss "")
  (command "_.-insert" blockName basePt 1 1 0)

  (princ (strcat "\nBlock \"" blockName "\" created and inserted successfully."))
  (princ "\nAutoLISP tool collected and shared for non-profit by iViDLab.com")
  (princ)
)
