# import des modules
import tkinter as tk


import sys
import threading
import time


###### fonction 
def estValide(pos, d, vide=True):
    new = [pos[0], pos[1]]
    new[0] += d[0]
    new[1] += d[1]
    # cas de débordement sur la colonne
    
    if (new[0] >=0) and (new[0]<taille_jeu) and (new[1] >=0) and (new[1]<taille_jeu):
        valid = True
        val_pos = data[new[0]][new[1]][0]
        if vide and val_pos != 0:
            valid = False
    else:
        valid = False

        
    return valid
    
###### fonction 
def decalage(pos, d):
    new = [pos[0], pos[1]]
    new[0] += d[0]
    new[1] += d[1]
    # cas de débordement sur la colonne
    if new[0] < 0:
        new[0] += taille_jeu
    if new[0] >= taille_jeu:
        new[0] -= taille_jeu
        
    # cas de débordement sur la ligne
    if new[1] < 0:
        new[1] += taille_jeu
    if new[1] >= taille_jeu:
        new[1] -= taille_jeu
    
    return new



###### fonction 
def majMinMax(v):
    global min_max
    
    if v < min_max[0]:
        min_max[0] = v
        
    if v > min_max[1]:
        min_max[1] = v



###### fonction 
def printSommes():
    for s in range(taille_sommes):
        printLigne(txt_sommes[s]+" ",sommes[s])


    
###### fonction 
def lire_stdin(preambule=None):
    if preambule is not None:
        print(preambule)
    val = sys.stdin.read(2)
    val = val.rstrip()
    #print("."+val+".")
    if val.startswith("q") or val.startswith("Q"):
        sys.exit()
        
    return val


class Parcours():
    jeu_position = [-1,-1]
    jeu_compteur = 1
    autreP = 0
    grille = 0
    ownIndex = 0
    green_on_off = 0

    def __init__(self, g, own):
        self.grille = g
        self.ownIndex = own
        
    def setAutre(self, autreP):
        self.autre = autreP

    def sauver(self):
        v = 1
        posc = self.trouverValeur([v, 0])
        s = str(taille_jeu)+" "+str(posc[0])+","+str(posc[1])+" "
        while v < nbcases_jeu:
            posn = self.trouverValeur([v+1, 0])
            for k, dk in enumerate(depl_jeu):
                if posn[0]-posc[0] == dk[0] and posn[1]-posc[1] == dk[1]:
                    s = s+str(k)
            posc = posn
            v += 1
        print(s)
        return s
            
    def trouverValeur(self, val):
        for c in range(taille_jeu):
            for l in range(taille_jeu):
                if data[c][l] == val:
                    return [c,l]

        return [-1, -1]

    def rotationCirculaire(self):
        for c in range(taille_jeu):
            for l in range(taille_jeu):
                if data[c][l][0] != 1:
                    data[c][l][0] -= 1
                else:
                    data[c][l][0] = nbcases_jeu

    def majSommes(self):
        if self.ownIndex == 0:
            self.grille.majSommes()

    def renverserValeurs(self):
        for c in range(taille_jeu):
            for l in range(taille_jeu):
                [v, ind] = data[c][l]
                if v != 0 and ind == self.ownIndex:
                    data[c][l] = [self.jeu_compteur - v, self.ownIndex]
                    #self.grille.set(c, l, self.ownIndex)

    def nextColors(self):
        found = 0
        
    # selectionner : suivant le contexte : avancer / revenir en arrière / inverser
    def selectionner(self, i, j):
        echap = False
        valid = False
        if self.jeu_position == [i, j]:
            if self.jeu_compteur <= nbcases_jeu:
                self.jeu_compteur -= 1
                data[i][j] = [0,-1]

                self.jeu_position = self.trouverValeur([self.jeu_compteur-1, self.ownIndex])

                self.majSommes()
            else:
                self.rotationCirculaire()
            valid = True
            echap = True
            
        elif data[i][j] == [1, self.ownIndex]:
            if self.ownIndex == 0:
                remaining = 0
            
                for dk in depl_jeu:
                    if estValide([i,j], dk):
                        remaining += 1
            else:
                remaining = 1

                    
            if remaining > 0:
                self.renverserValeurs()            
                self.jeu_position = self.trouverValeur([self.jeu_compteur-1, self.ownIndex])
                valid = True
                echap = True
             
        elif self.jeu_position != [-1, -1]:
            if data[i][j][0] == 0:
                d=[i-self.jeu_position[0],j-self.jeu_position[1]]
                valid = False
                for de in depl_jeu:
                    if d == de:
                        valid = True
        else:
            valid = True

        if valid == True:
            if not echap:
                self.green_on_off = 0
                data[i][j] = [self.jeu_compteur, self.ownIndex]
                #self.grille.set(i,j, self.ownIndex)

                if self.jeu_compteur == nbcases_jeu:
                    self.jeu_position = self.trouverValeur([1, self.ownIndex])
                    d = [self.jeu_position[0] - i, self.jeu_position[1] - j]
                    for dk in depl_jeu:
                        if d == dk:
                            self.grille.cyclique = True

                self.jeu_compteur += 1

                self.majSommes()
                self.jeu_position = [i, j]

        if valid:
            return 1
        else:
            return 0

class Parallel():
    pos1 = [-1,-1]
    pos2 = [-1,-1]
    pos3 = [-1,-1]
    pos4 = [-1,-1]

    val1 = 1
    val3 = 0

    kd = 0
    

class Grille(tk.Tk):
    global taille_jeu
    cyclique = False

    # to modify
    selectScoreToMin = 0

    bary_poids = [0 for x in range(500)]
    progressBar = 0
    pct      = 0
    sauve    = 0
    permutCir= [0,0]
    parallel = 0
    altern   = 0
    serpent  = 0
    auto     = 0
    selection= 0
    queue    = 0
    score    = [0,0]
    minlabel = [0,0]
    scoretxt = [0,0]
    scorbary = 0
    balance  = 0
    bal_min  = 0
    moyenne  = 0
    note_jeu = [0,0]
    nmax     = 9999999999
    minscore = [nmax,nmax]
    minbary  = nmax
    minparc  = ["", ""]
    autoInd  = [0,0]
    th = 0
    noSym = 0

    lblselect=["> auto  +  <", "> auto  +x <", "> auto -/- <"]
    
    # le jeu peut comprendre deux parcours
    Parc = [0, 0]
    # index du Parcours actif courant
    indexCourant = 0
    # index sur la recherche de parallélogramme
    Parallel = 0
    
    def __init__(self, taille_jeu):
        tk.Tk.__init__(self)
        self.title("Jeu Carré")

        self.initButtons()

        self.Parc[0] = Parcours(self, 0)
        self.Parc[1] = Parcours(self, 1)

        self.Parc[0].setAutre(self.Parc[1])
        self.Parc[1].setAutre(self.Parc[0])

        self.Parallel = Parallel()

        self.showActive = True
        self.verbose = False
        
        if taille_jeu%2 == 0:
            poids = taille_jeu-1
            for i in range(taille_jeu):
                self.bary_poids[i] = poids
                poids -= 2
        else:
            poids = int((taille_jeu-1)/2)*2
            for i in range(taille_jeu):
                self.bary_poids[i] = poids
                poids -= 2
            
        #print(str(self.bary_poids))
    


    # appelé deux fois dans majSommes
    def maj_note_jeu(self, etape):
        note_jeu = min_max[1]-min_max[0]
        self.note_jeu[etape] = note_jeu
        c = [" ", "x"]
        self.score[etape]['text'] = "+{} {}".format(c[etape],note_jeu)
        if min_max[1] > self.moyenne:
            self.scoretxt[etape]['text'] = "{}  /  {}".format(min_max[1]-self.moyenne,min_max[0]-self.moyenne)
        else:
            self.scoretxt[etape]['text'] = "...  /  {}".format(min_max[0]-self.moyenne)

    def permutCirculaire(self):
        if self.cyclique:
            for col in range(taille_jeu):
                for lig in range(taille_jeu):
                    val, parc = data[col][lig]
                    if val == 1 :
                        newval = nbcases_jeu
                    else:
                        newval = val-1

                    data[col][lig] = [newval,0]
                    #self.set(col, lig, 0)

            self.majTout()
            
    def permutCirculaireInv(self):
        if self.cyclique:
            for col in range(taille_jeu):
                for lig in range(taille_jeu):
                    val, parc = data[col][lig]
                    if val == 100 :
                        newval = 1
                    else:
                        newval = val+1

                    data[col][lig] = [newval,0]
                    #self.set(col, lig, 0)

            self.majTout()

    def showPc(self):
        found = 0
        

    def changeSelection(self):
        self.selectScoreToMin += 1
        self.selectScoreToMin %= 3

        self.selection['text'] = self.lblselect[self.selectScoreToMin]
            

    def getCurr(self):
        i = self.selectScoreToMin
        if i == 2:
            curr = self.scorbary
        else:
            curr = self.note_jeu[i]
        return curr

    def step(self):
        taille = 200
        nbt = 8
        lp = [11,13,17,19,23,29]
        if self.autoInd[0] < len(lp):
            p = lp[self.autoInd[0]]

            for i in range(taille):              
                v1 = self.getCurr()
                self.parallel()
                self.altern()
                v2 = self.getCurr()
                if v2 > v1:
                    #print("back")
                    self.altern()
                elif v2 < v1:
                    print(f"new:{v2}")

            self.autoInd[1] += 1
            if self.autoInd[1] == nbt:
                self.autoInd[1] = 0
                self.autoInd[0] += 1
            
            ip = self.autoInd[0]        

            a = float(nbt*ip+self.autoInd[1])
            b = float(nbt*len(lp))
            
            self.pct = float(int(1000*a/b))/10
            self.progressBar['text'] = "{} %".format(self.pct)
        else:
            self.autoInd[0] = 0
            
    def parallel(self):
        found   = False
        reprise = True
        nbIter = 0
        if self.Parc[0].jeu_compteur == nbcases_jeu + 1:
            while not found and nbIter < nbcases_jeu:
                nbIter += 1
                self.Parallel.pos1 = self.Parc[0].trouverValeur([self.Parallel.val1  , 0])
                self.Parallel.pos2 = self.Parc[0].trouverValeur([self.Parallel.val1+1, 0])
                pos1 = self.Parallel.pos1
                pos2 = self.Parallel.pos2
                d = [pos2[0]-pos1[0], pos2[1]-pos1[1]]

                if reprise:
                    k = self.Parallel.kd+1
                    reprise = False
                else:
                    k = 0

                while not found  and k<len(depl_jeu):
                    dk = depl_jeu[k]
                    if estValide(pos1, dk, False):
                        self.Parallel.pos3 = decalage(pos1, dk)
                        pos3 = self.Parallel.pos3
                        self.Parallel.val3 = data[pos3[0]][pos3[1]][0]

                        if pos3 != pos2 and estValide(pos3, d, False):
                            self.Parallel.pos4 = decalage(pos3, d)
                            pos4 = self.Parallel.pos4
                            val4 = data[pos4[0]][pos4[1]][0]
                            
                            if val4 == self.Parallel.val3+1 and val4 > self.Parallel.val1+2:
                                self.Parallel.dk = k
                                
                                found = True
                            
                    k += 1

                self.Parallel.kd = k
                if not found:
                    if self.Parallel.val1 < nbcases_jeu-1:
                        self.Parallel.val1 += 1
                    else:
                        self.Parallel.val1 = 1

    def majTout(self, majSomme=True):
        if majSomme:
            self.majSommes()

        c = [" ", "x"]
        for i in range(2):
            if self.note_jeu[i] < self.minscore[i]:
                self.minscore[i] = self.note_jeu[i]
                self.minparc[i] = self.sauver()
                 
                self.minlabel[i]['text'] = "+{} {}".format(c[i], self.minscore[i])
                print("# "+self.minlabel[i]['text'])

            if self.scorbary < self.minbary:
                self.minbary = self.scorbary
                self.sauver()
                self.bal_min['text'] = str(self.scorbary)
                print("# bary "+str(self.scorbary))
        
    
    def sauver(self):
        return self.Parc[0].sauver()

    def altern(self):
        first = self.Parallel.val1
        
        if first != 0 and self.Parallel.val3 > first:
            apos = [[0,0]] * nbcases_jeu
            pos1 = self.Parc[0].trouverValeur([first             , 0])
            pos3 = self.Parc[0].trouverValeur([self.Parallel.val3, 0])

            indpos = 0
            for v in range(self.Parallel.val3, first, -1):
                apos[indpos] = self.Parc[0].trouverValeur([v , 0])
                indpos += 1

            newval = first+1
            for i in range(indpos):
                pos = apos[i]
                data[pos[0]][pos[1]] = [newval, 0]
                #self.set(pos[0],pos[1],0)
                newval += 1

            self.majTout()

                    

    def merge(self):
        found = 0
           
    def nextSym(self):
        self.noSym += 1
        self.noSym %= 4
        self.sym['text'] = f"Sym-{self.noSym}"
        
    def switch(self):
        #print("Switch {}->{}".format(self.indexCourant, 1-self.indexCourant))
        self.indexCourant = 1-self.indexCourant
        self.swButton['text'] = self.indexCourant+1
        
        
    def click(self, i, j, recall=False):
        self.Parc[0].selectionner(i,j)
            
            
    def majSommes(self):
        global sommes, min_max, note_jeu
        
        # reset (all to 0)
        for k in range(taille_sommes):
            sommes[k] = [0 for x in range(taille_jeu)]

        bary_col = 0
        bary_lig = 0
        

        min_max = [9999999, 0]
        # calcul des sommes
        for col in range(taille_jeu):
            for lig in range(taille_jeu):
                [val, parc] = data[col][lig]
                if parc == 0: # principal
                    sommes[ind_col][col] += val
            bary_col += self.bary_poids[col]*sommes[ind_col][col]
            majMinMax(sommes[ind_col][col])

        if self.verbose and self.Parc[0].jeu_compteur > nbcases_jeu:
            print("sommes col: "+" ".join(str(sommes[ind_col][c]) for c in range(taille_jeu)))
            
        for lig in range(taille_jeu):
            for col in range(taille_jeu):
                [val, parc] = data[col][lig]
                if parc == 0: # principal
                    sommes[ind_lig][lig] += val
            bary_lig += self.bary_poids[lig]*sommes[ind_lig][lig]
            majMinMax(sommes[ind_lig][lig])

        if self.verbose and self.Parc[0].jeu_compteur > nbcases_jeu:
            print("sommes lig: "+" ".join(str(sommes[ind_lig][l]) for l in range(taille_jeu)))

        self.scorbary = max(abs(bary_col),abs(bary_lig))
        self.balance['text'] = str(self.scorbary)
        self.balanceXY['text'] = str(bary_col)+" / "+str(bary_lig)

        if (abs(bary_col)==0 or abs(bary_lig)==0) and self.scorbary < 50:
            self.sauver()
            print("# bary c:{} l:{}".format(bary_col,bary_lig))
        
            
       
        self.maj_note_jeu(0)
        
        for k in range(taille_jeu):
            pos2 = [k,0]
            pos3 = [k,0]
            for j in range(taille_jeu):
                [val2, parc] = data[pos2[0]][pos2[1]]
                [val3, parc] = data[pos3[0]][pos3[1]]
                if parc == 0:
                    sommes[ind_dgd][k] += val2
                    sommes[ind_dgg][k] += val3
                    
##                if self.Parc[0].jeu_compteur == nbcases_jeu+1: 
##                    print(str(pos2)+" "+str(pos3))
                pos2 = decalage(pos2, dec_dgd)
                pos3 = decalage(pos3, dec_dgg)

##            if self.Parc[0].jeu_compteur == nbcases_jeu+1: 
##                print("res: "+str(sommes[ind_dgd][k])+" "+str(sommes[ind_dgg][k]))
            majMinMax(sommes[ind_dgd][k])
            majMinMax(sommes[ind_dgg][k])


        self.maj_note_jeu(1)
                

    def initButtons(self):
        N = taille_jeu
        # pow = 2 --> self.moyenne = int((N * (N*N+1)* (2*N*N+1))/6)
        self.moyenne = int((N * (N*N+1))/2)


        taille_font  = 12
        taille_font2 = 20
        taille_ipady = 8

        c = [" ","x"]
        for i in range(2):         
            self.score[i] = tk.Label(self, text="+{} score".format(c[i]), font=('Arial', taille_font2))
            self.score[i].grid(column=taille_jeu+2+i,    row=1, padx=0, pady=0)
            self.scoretxt[i] = tk.Label(self, text="  ", justify="left", anchor="w", font=('Arial', taille_font-1))
            self.scoretxt[i].grid(column=taille_jeu+2+i, row=2, padx=0, pady=0)

            self.minlabel[i] = tk.Label(self, text="+{} min".format(c[i]), font=('Arial', taille_font2-1))
            self.minlabel[i].grid(column=taille_jeu+2+i, row=6, padx=0, pady=0)

        self.balance = tk.Label(self, text="bary", font=('Arial', taille_font2))
        self.balance.grid(column=taille_jeu+4, row=1, padx=0, pady=0)
        self.balanceXY = tk.Label(self, text="", font=('Arial', taille_font-1))
        self.balanceXY.grid(column=taille_jeu+4, row=2, padx=0, pady=0)
        self.bal_min = tk.Label(self, text="bary", font=('Arial', taille_font2))
        self.bal_min.grid(column=taille_jeu+4, row=6, padx=0, pady=0)

        # controle sur les 2 parcours : switch et fusion
        self.swButton = tk.Button(self,
                              text="1",
                              font=('Arial', taille_font),
                              command= self.switch)
        self.swButton.grid(column=taille_jeu+2, row=4)

        self.merge = tk.Button(self,
                              text="fusion",
                              font=('Arial', taille_font),
                              command= self.merge)
        self.merge.grid(column=taille_jeu+3, row=4)

        self.sym = tk.Button(self,
                                      text="Sym-0",
                                      font=('Arial', taille_font),
                                      command= self.nextSym)
        self.sym.grid(column=taille_jeu+4, row=4)
        
        # self.permutCirculaire
        self.permutCir[0] = tk.Button(self,
                              text="1 >> fin",
                              font=('Arial', taille_font),
                              command= self.permutCirculaire)
        self.permutCir[0].grid(column=taille_jeu+2, row=5)

        self.permutCir[1] = tk.Button(self,
                              text="fin >> 1",
                              font=('Arial', taille_font),
                              command= self.permutCirculaireInv)
        self.permutCir[1].grid(column=taille_jeu+3, row=5)

        # controle sur les parallélogrammes, chemin alternatif : find et altern
        self.find = tk.Button(self,
                              text="/  parallele  /",
                              font=('Arial', taille_font),
                              command= self.parallel)
        self.find.grid(column=taille_jeu+2, row=7)

        self.alter = tk.Button(self,
                              text="/ chemin bis /",
                              font=('Arial', taille_font),
                              command= self.altern)
        self.alter.grid(column=taille_jeu+3, row=7)

        self.progressBar = tk.Label(self, text=" % ", font=('Arial', taille_font))
        self.progressBar.grid(column=taille_jeu+3, row=8)

        self.selection = tk.Button(self,
                              text=self.lblselect[0],
                              font=('Arial', taille_font),
                              command= self.changeSelection)
        self.selection.grid(column=taille_jeu+4, row=8)

        # bouton sauver
        self.sauve = tk.Button(self,
                              text="sauver",
                              font=('Arial', taille_font),
                              command= self.sauver)
        self.sauve.grid(column=taille_jeu+2, row=9)

        for i in range(4):
            for j in range(4):
                b = tk.Button(self,
                              width=4,
                              #text="__",
                              font=('Arial', taille_font),
                              command= lambda x=i, y=j: self.click(x, y))
                
                b.grid(row=i, column=j, ipady=taille_ipady, sticky="nsew")


class App:
    def __init__(self, root):
        self.root = root
        self.serpentActif = False

        if taille_jeu < 20:
            taille_font  = 12
            taille_font2 = 20
            taille_ipady = 8
        else:
            taille_font  = 8
            taille_font2 = 9
            taille_ipady = 3

        root.serpent = tk.Button(root,
                              text="/ serpent /",
                              font=('Arial', taille_font),
                              command= self.switch_cell)
        root.serpent.grid(column=taille_jeu+4, row=7)

        root.auto = tk.Button(root,
                              text="/   auto   /",
                              font=('Arial', taille_font),
                              command= self.auto)
        root.auto.grid(column=taille_jeu+2, row=8)


        # Index pour garder la progression du coloriage
        self.current_index = 1

    def switch_cell(self):
        found = 0
        
    def color_cell(self):
        found = 0

    def auto(self):
        self.root.step()


if __name__ == '__main__':

    try:
        taille_jeu = int(sys.argv[1])
    except:
        taille_jeu = 17
        taille_jeu = 10
        pass
    ##    taille_jeu = 19
    ##    taille_jeu = 13

    #         [val, #parcours]
    data = [[ [0  ,   0] for x in range(taille_jeu)] for x in range(taille_jeu)]

    verboseTxt = False
    ind_col = 0
    ind_lig = 1
    ind_dgd = 2 # diag direction bas-droit  (+1,+1)
    dec_dgd = [+1,+1]
    ind_dgg = 3 # diag direction bas-gauche (+1,-1)
    dec_dgg = [+1,-1]

    nbcases_jeu   = taille_jeu * taille_jeu
    txt_sommes    = ['col','lig','dgd','dgg']
    taille_sommes = len(txt_sommes)
    sommes = [[0 for x in range(taille_jeu)] for x in range(taille_sommes)]

    #             '+n'       'xn'
    depl_jeu = [[+3,  0], [+2, +2],
                [ 0, +3], [-2, +2],
                [-3,  0], [-2, -2],
                [ 0, -3], [+2, -2]]

        

    app = Grille(taille_jeu)

    if len(sys.argv) == 4:
        pos = sys.argv[2].split(",")
        pos = [int(pos[0]),int(pos[1])]
        app.click(pos[0],pos[1])
        ds = sys.argv[3]

        for n in range(len(ds)):
            id = int(ds[n:n+1])
#            id = trans[id]
            
            d = depl_jeu[id]

            pos = decalage(pos,d)
            app.click(pos[0],pos[1])
    add = App(app)
    app.mainloop()


