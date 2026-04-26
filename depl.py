import re

#print(str(sqrt))

# Exemple : ta grille n x n à coller ci-dessous

gr = """
138 105   3 139 106   4 144 107   5 172 108  35 171 127
121  57 136 122  58 135 123  59 134  67  62 133  68  63
  2 140 101   1 145 100  23 173 125  36 155 126  37 156
137 104  14 142 103  15 143 110   6 169 109  34 170 128
120  56 146  99  22 174 124  60 154  66  61 132  69  64
 13 141 102  16 191 111  24 190  93  33 189 129  38 157
147  98  19 175  97  18 153  96   7 168  95  65 167 131
119  55 192 112  21 179  92  32 188  80  45 162  70  44
 12 176  89  17 194  88  25 183  94  26 184 130  39 158
148 113  20 178  91  31 152  79   8 163  78  49 166  75
118  54 193 115  28 180  84  27 187  81  46 161  71  43
 11 177  90  10 195  87   9 182  86  50 185  74  40 159
149 114  29 150  83  30 151  82  47 164  77  48 165  76
117  53 196 116  52 181  85  51 186  73  41 160  72  42
"""

gr = """
 21  24  62  20  23  63  19  38
 27  54  11  26  53  12  33  52
 61   8  22  64   9  37  47   2
 14  25  59  13  34  58  18  39
 28  55  10  43  46   1  32  51
 60   7  35  57   6  36  48   3
 15  42  45  16  41  44  17  40
 29  56   5  30  49   4  31  50
"""

def printGr(gr):
# Définition des 8 déplacements autorisés (ligne, colonne)
    moves = [
     (+3, 0), # 0
     (+2, +2), # 1
     ( 0, +3), # 2
     (-2, +2), # 3
     (-3, 0), # 4
     (-2, -2), # 5
     ( 0, -3), # 6
     (+2, -2) # 7
    ]

    sqrt = {}

    for i in range(500):
        sqrt[f"{i*i}"] = i
    gr = gr.replace("\n","  ").replace("   "," ").replace("  "," ")
    c = gr[1:-1].split(" ")
    #print(c[0:16])
    key = str(len(c))
    #print(key)
    try:
        n = sqrt[key]
        grid = [range(n) for _ in range(n)]
        for i in range(n):
            grid[i] = c[n*i:n*(i+1)]
    except:
        print(f"number {len(c)} not a square")
        
    s = "python p1.py "+str(n)
    positions = {}

    # Enregistre la position (ligne, colonne) de chaque nombre
    for i in range(n):
     for j in range(n):
      k = int(grid[i][j])
      if k == 1 :
          s += f" {i},{j} "
      positions[k] = (i, j)

    sequence = ""
    errors = []

    for k in range(1, n * n):

        r1, c1 = positions[k]
        if k < n*n:
            r2, c2 = positions[k + 1]
        else:
            r2, c2 = positions[1]
        dr, dc = r2 - r1, c2 - c1

     # Trouver l’indice du mouvement correspondant
        try:
           idx = moves.index((dr, dc))
           sequence += str(idx)
        except ValueError:
            errors.append(f"⚠️ Mouvement non valide entre {k} et {k+1}: ({dr},{dc})")


    # Résultats
    # print("Séquence :", sequence)
    if errors:
     print("\nErreurs détectées :")
     for e in errors:
      print(e)
    else:
     s += sequence

     print("")
     print(s)
     print("\n✅ Aucune erreur, parcours cohérent.")

if __name__ == '__main__':
    printGr(gr)
