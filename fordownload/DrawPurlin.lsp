;;; LISP FOR DRAWING COLD-FORMED C AND Z PURLIN SECTIONS
;;; Command: VEXAGO
;;; Features & Fixes:
;;; - Accurate corner fillets: Inner radius = 2T, Outer radius = 3T.
;;; - Parameter caching (remembers parameters from the last run).
;;; - Restores OSNAP upon completion or interruption (*error* trapping).
;;; - Accurate outward bending of Z purlin lip angle.
;;; - Reliable Polyline offset algorithm using vla-offset method.

(defun c:VEXAGO ( / *error* oldOs oldCmd oldPedit profStr inputScale scale lipAngStr lipAng insPt 
                   str lst pos firstPart type H B1 B2 C_lip T_thick 
                   Hc B1c B2c Cc pC p1 p2 p3 p4 p5 p6 radAng
                   ent1 vla-pline off1 off2 ent2 ent3 ptStart2 ptEnd2 ptStart3 ptEnd3
                   line1 line2 R_center)
  
  (vl-load-com)
  
  ;; Error trap to restore system variables (OSNAP) if command is cancelled
  (defun *error* (msg)
    (if oldOs (setvar "OSMODE" oldOs))
    (if oldCmd (setvar "CMDECHO" oldCmd))
    (if oldPedit (setvar "PEDITACCEPT" oldPedit))
    (princ (strcat "\nError or command cancelled: " msg))
    (princ)
  )

  (setq oldOs (getvar "OSMODE"))
  (setq oldCmd (getvar "CMDECHO"))
  (setq oldPedit (getvar "PEDITACCEPT"))

  ;; Initialize parameter cache if not set yet
  (if (not *VEXAGO_LAST_PROF*) (setq *VEXAGO_LAST_PROF* "Z250*62*68*2.5"))
  (if (not *VEXAGO_LAST_SCALE*) (setq *VEXAGO_LAST_SCALE* 1.0))
  (if (not *VEXAGO_LAST_ANG*) (setq *VEXAGO_LAST_ANG* 45.0))

  ;; 1. Input profile code (Cached)
  (setq profStr (getstring (strcat "\nNhap ma tiet dien (VD: Z250*62*68*2.5 hoac C200*50*20*2) <" *VEXAGO_LAST_PROF* ">: ")))
  (if (= profStr "") (setq profStr *VEXAGO_LAST_PROF*))
  (setq *VEXAGO_LAST_PROF* profStr)
  
  ;; 2. Input scale ratio (Cached)
  (setq inputScale (getreal (strcat "\nNhap ty le thu nho (nhap 10 de thu 1/10) <" (rtos *VEXAGO_LAST_SCALE* 2 2) ">: ")))
  (if (not inputScale) (setq inputScale *VEXAGO_LAST_SCALE*))
  (setq *VEXAGO_LAST_SCALE* inputScale)
  (setq scale (/ 1.0 inputScale))
  
  ;; 3. Parse input profile string
  (setq str (strcase profStr))
  (setq lst '())
  (while (setq pos (vl-string-search "*" str))
    (setq lst (append lst (list (substr str 1 pos))))
    (setq str (substr str (+ pos 2)))
  )
  (setq lst (append lst (list str)))
  
  (setq firstPart (nth 0 lst))
  (setq type "C" H 200.0 B1 50.0 B2 50.0 C_lip 20.0 T_thick 2.0)
  
  (if (wcmatch firstPart "Z*")
    (progn
      (setq type "Z")
      (setq H (atof (substr firstPart 2)))
      (if (= (length lst) 4)
        (progn
          (setq B1 (atof (nth 1 lst)))
          (setq B2 (atof (nth 2 lst)))
          (setq C_lip 20.0)
          (setq T_thick (atof (nth 3 lst)))
        )
      )
      (if (= (length lst) 5)
        (progn
          (setq B1 (atof (nth 1 lst)))
          (setq B2 (atof (nth 2 lst)))
          (setq C_lip (atof (nth 3 lst)))
          (setq T_thick (atof (nth 4 lst)))
        )
      )
    )
    (progn
      (setq type "C")
      (if (wcmatch firstPart "C*")
        (setq H (atof (substr firstPart 2)))
      )
      (if (= (length lst) 3)
        (progn
          (setq B1 (atof (nth 1 lst)))
          (setq B2 B1)
          (setq C_lip 20.0)
          (setq T_thick (atof (nth 2 lst)))
        )
      )
      (if (= (length lst) 4)
        (progn
          (setq B1 (atof (nth 1 lst)))
          (setq B2 B1)
          (setq C_lip (atof (nth 2 lst)))
          (setq T_thick (atof (nth 3 lst)))
        )
      )
    )
  )

  ;; Lip angle selection (for Z purlins only)
  (setq lipAng 90.0)
  (if (= type "Z")
    (progn
      (setq lipAngStr (getstring (strcat "\nChon goc mep gap Z (Lip Angle) [90/50/45] <" (rtos *VEXAGO_LAST_ANG* 2 0) ">: ")))
      (if (= lipAngStr "")
        (setq lipAng *VEXAGO_LAST_ANG*)
        (setq lipAng (atof lipAngStr))
      )
      (setq *VEXAGO_LAST_ANG* lipAng)
    )
  )

  ;; 4. Select insertion point
  (setq insPt (getpoint "\nChon diem chen: "))
  (if (not insPt) (exit))

  (setvar "OSMODE" 0)
  (setvar "CMDECHO" 0)
  
  ;; Apply scale factor to dimensions
  (setq H (* H scale) B1 (* B1 scale) B2 (* B2 scale) C_lip (* C_lip scale) T_thick (* T_thick scale))
  
  ;; Calculate centerline dimensions
  (setq Hc (- H T_thick))
  (setq B1c (- B1 T_thick))
  (setq B2c (- B2 T_thick))
  (setq Cc (- C_lip (/ T_thick 2.0)))
  
  (setq pC insPt)
  
  (if (= type "Z")
    (progn
      ;; Z purlin centerline coordinates
      (setq p3 (list (car pC) (+ (cadr pC) (/ Hc 2.0)) 0.0))
      (setq p4 (list (car pC) (- (cadr pC) (/ Hc 2.0)) 0.0))
      (setq p2 (list (+ (car p3) B1c) (cadr p3) 0.0))
      (setq p5 (list (- (car p4) B2c) (cadr p4) 0.0))
      
      ;; Z Lip bent outwards from web
      (setq radAng (* lipAng (/ pi 180.0)))
      (setq p1 (list (+ (car p2) (* Cc (cos radAng))) (- (cadr p2) (* Cc (sin radAng))) 0.0))
      (setq p6 (list (- (car p5) (* Cc (cos radAng))) (+ (cadr p5) (* Cc (sin radAng))) 0.0))
      
      (command "_.PLINE" "_non" p1 "_non" p2 "_non" p3 "_non" p4 "_non" p5 "_non" p6 "")
    )
    (progn
      ;; C purlin centerline coordinates
      (setq p3 (list (car pC) (+ (cadr pC) (/ Hc 2.0)) 0.0))
      (setq p4 (list (car pC) (- (cadr pC) (/ Hc 2.0)) 0.0))
      (setq p2 (list (+ (car p3) B1c) (cadr p3) 0.0))
      (setq p5 (list (+ (car p4) B2c) (cadr p4) 0.0))
      
      (setq p1 (list (car p2) (- (cadr p2) Cc) 0.0))
      (setq p6 (list (car p5) (+ (cadr p5) Cc) 0.0))
      
      (command "_.PLINE" "_non" p1 "_non" p2 "_non" p3 "_non" p4 "_non" p5 "_non" p6 "")
    )
  )
  
  (setq ent1 (entlast))
  
  ;; 5. Fillet centerline with R = 2.5 * T 
  ;; -> Offsetting by T/2 results in accurate Inner R = 2T and Outer R = 3T!
  (setq R_center (* 2.5 T_thick))
  (command "_.FILLET" "R" R_center)
  (vl-cmdf "_.FILLET" "P" ent1)
  
  ;; 6. Offset using vla-object (100% safe, avoids direction errors)
  (setq vla-pline (vlax-ename->vla-object ent1))
  
  (setq off1 (vlax-variant-value (vla-offset vla-pline (/ T_thick 2.0))))
  (setq ent2 (vlax-vla-object->ename (vlax-safearray-get-element off1 0)))
  
  (setq off2 (vlax-variant-value (vla-offset vla-pline (/ T_thick -2.0))))
  (setq ent3 (vlax-vla-object->ename (vlax-safearray-get-element off2 0)))
  
  (entdel ent1) ; Delete centerline
  
  (setq ptStart2 (vlax-curve-getStartPoint ent2))
  (setq ptEnd2 (vlax-curve-getEndPoint ent2))
  (setq ptStart3 (vlax-curve-getStartPoint ent3))
  (setq ptEnd3 (vlax-curve-getEndPoint ent3))
  
  ;; Connect end edges
  (command "_.LINE" "_non" ptStart2 "_non" ptStart3 "")
  (setq line1 (entlast))
  (command "_.LINE" "_non" ptEnd2 "_non" ptEnd3 "")
  (setq line2 (entlast))
  
  ;; 7. Join into a single closed Polyline (PEDIT Multiple)
  (setvar "PEDITACCEPT" 1)
  (command "_.PEDIT" "_M" ent2 ent3 line1 line2 "" "_J" "0.0" "")
  
  ;; Restore system variables
  (setvar "PEDITACCEPT" oldPedit)
  (setvar "OSMODE" oldOs)
  (setvar "CMDECHO" oldCmd)
  
  (princ "\nSuccessfully created closed polyline purlin!")
  (princ "\nResearched and developed by iViDLab.com")
  (princ)
)
(princ "\nType VEXAGO to start. Researched and developed by iViDLab.com")
(princ)
