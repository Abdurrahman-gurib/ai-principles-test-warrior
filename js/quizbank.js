/* Extra quiz bank: many more MCQs per topic (calculations + concepts + traps). Each has an explanation. */
(function(){
const by=Object.fromEntries(window.TOPICS.map(t=>[t.id,t]));
const add=(id,list)=>list.forEach(([q,o,a,x])=>by[id].quiz.push({q,o,a,x}));
add('test',[
['A question is worth [4 Marks] and says "justify". The best structure is…',['One sentence','Four reasons, each linked to the scenario','Only a diagram','A definition'],1,'Roughly one mark per justified point, linked to the scenario.'],
['In an A* answer you must clearly…',['Only state the path','Label each node g + h = f, number the expansions, highlight the path, state the cost','Skip the tree','Use DFS'],1,'The paper asks for all of these explicitly.'],
['Sample Test 2025 Q1(b) starts the search from node…',['S','A','G','B'],1,'"find the shortest path from node A (start) to node G": read the question!'],
['How many minutes per 10-mark question in a 1-hour test with about 4 questions?',['5','15','25','30'],1,'60 ÷ 4 = 15 minutes.'],
['Which topic is EXCLUDED (class tip)?',['A* search','Linear regression','Perceptron','CSP'],1,'Linear regression is excluded; gradient descent is still covered.']]);
add('intro',[
['Which is NOT one of the AI techniques listed in Lecture 1?',['Bayesian networks','Fuzzy logic','Expert systems','Spreadsheet macros'],3,'The list: ML, DL, expert systems, neural nets, Bayesian nets, fuzzy logic.'],
['"Intelligence measures an agent\'s ability to achieve goals in a wide range of environments" is by…',['Turing','Legg & Hutter','McCarthy','Searle'],1,'Legg and Hutter\'s definition (Lecture 1 Series).'],
['In 2008 the best Loebner-contest system fooled about…',['None','A quarter of the judges','Half','All'],1,'About ¼ of judges.'],
['AlphaGo beat Fan Hui (2015)…',['3-2','5-0','4-1','1-0'],1,'5-0; then Lee Sedol 4-1 in 2016.'],
['Woebot is an example of…',['A recommender','An NLP chatbot for anxiety/depression','A robot','A search algorithm'],1,'Lecture 1: an NLP chatbot.'],
['EXODUS software simulates…',['Traffic flow','Building evacuation with agents','Stock markets','Chess'],1,'People as agents in virtual buildings.'],
['Bloomberg uses NLG to…',['Translate speech','Write about 2000 stories per second','Detect tumours','Drive cars'],1,'Natural language generation drafts news.'],
['Which language did McCarthy create for symbolic AI?',['Python','LISP','Prolog','Java'],1,'LISP, 1958.'],
['Prolog is mainly used for…',['GPU training','Logic programming with facts and rules','Web design','Spreadsheets'],1,'Facts + rules, backward chaining.'],
['AI draws on which disciplines (Lecture 1)?',['Only CS','CS, psychology, neuroscience, biology, mathematics','Only maths','Only biology'],1,'AI is interdisciplinary.']]);
add('agents',[
['A thermostat that switches on when the temperature is below 20 °C is a…',['Utility-based agent','Simple reflex agent','Learning agent','Goal-based agent'],1,'A single condition-action rule on the current percept.'],
['Image classification (each photo independent) is…',['Sequential','Episodic','Multi-agent','Continuous'],1,'Each decision does not affect the next.'],
['Poker is…',['Fully observable','Partially observable','Deterministic','Single-agent'],1,'You cannot see the opponents\' cards.'],
['A crossword puzzle is…',['Dynamic','Static','Stochastic','Multi-agent'],1,'The world does not change while you think.'],
['In PEAS for a taxi, "GPS, cameras, speedometer" are…',['Actuators','Sensors','Performance','Environment'],1,'They perceive the world.'],
['In PEAS for a taxi, "steering, brake, horn" are…',['Sensors','Actuators','Performance','Environment'],1,'They act on the world.'],
['The learning agent component that gives feedback on performance is the…',['Critic','Actuator','Sensor','Problem generator'],0,'The critic evaluates; the problem generator suggests exploratory actions.'],
['A rational agent…',['Is always perfect','Maximises its expected performance given its percepts','Never learns','Ignores percepts'],1,'Rational ≠ omniscient.'],
['A self-driving car best matches which agent type?',['Simple reflex','Utility-based learning agent','Table-lookup','Random'],1,'It must trade off safety, time, comfort and learn.'],
['Chess with a clock is…',['Static','Semi-dynamic / dynamic (time matters)','Continuous','Single-agent'],1,'The clock runs while you think.']]);
add('uninformed',[
['BFS on a tree with b = 2, goal at depth 3: worst-case nodes generated ≈',['6','O(2³) = 8-15','100','3'],1,'O(b^d): about 2³ at the last level (15 nodes in total including levels 0-3).'],
['Which algorithm can return a non-optimal path when step costs differ?',['UCS','BFS','Dijkstra','A* with admissible h'],1,'BFS minimises the number of steps, not the cost (Questions L2&3 Q3: cost 9 vs 7).'],
['Questions L2&3 Q4 (Dijkstra s → t): shortest distance =',['9','14','16','12'],1,'s-s1-s4-s5-s3-t = 1+4+1+1+7 = 14.'],
['Questions L2&3 Q5 (0 → 5): shortest path =',['0-2-5 (15)','0-2-3-5 (14)','0-3-5 (18)','0-5 (∞)'],1,'5 + 1 + 8 = 14.'],
['Newark → Cape May (Dijkstra) =',['165','175','180','150'],0,'Newark-Woodbridge-Camden-Cape May = 20 + 60 + 85.'],
['Port Louis → Plaisance (Dijkstra) =',['59','56','71','65'],0,'3 + 8 + 13 + 35 via Bell Village, Beau Bassin, Curepipe.'],
['In Dijkstra, after a node is made permanent its distance…',['Can still decrease','Is final','Becomes ∞','Is doubled'],1,'With non-negative weights the permanent value is final.'],
['DFID visits node order at limit 2 on a binary tree A(B(D,E),C(F,G)):',['A B C D E F G','A B D E C F G','A D E B F G C','A C B'],1,'Depth-limited DFS, alphabetical: A B D E C F G.'],
['Which uninformed search is NOT complete in infinite state spaces?',['BFS','DFS','DFID','UCS'],1,'DFS can go down an infinite branch.'],
['The water-jug problem state is…',['The number of moves','(x, y, z) litres in each jug','The pump','The sink'],1,'A state = the amounts in jugs 9, 5, 3.'],
['FORTY + TEN + TEN = SIXTY: F =',['1','2','8','9'],1,'29786 + 850 + 850 = 31486 → F = 2.'],
['Which data structure gives BFS its level-by-level order?',['Stack','Queue (FIFO)','Priority queue','Set'],1,'First in, first out.']]);
add('informed',[
['Sample Test 2025 Q1(b) (start A): the first node expanded after A is…',['S','B','C','D'],1,'f(B) = 1 + 6 = 7 is the lowest (S = 12, C = 12).'],
['After expanding B, f(C) via B =',['12','9','11','7'],1,'g = 1 + 3 = 4, h = 5 → 9 (replaces 12).'],
['Final answer of Sample Test Q1(b):',['A-C-E-G (13)','A-B-C-E-G (10)','A-B-D-G (12)','A-B-C-D-G (14)'],1,'1 + 3 + 4 + 2 = 10 km.'],
['Questions L2&3 Q3 (A*, directed): path and cost',['S-D-G, 9','S-D-C-G, 7','S-A-C-G, 8','S-B-D-G, 11'],1,'C improves via D, then G via C: 4 + 1 + 2 = 7.'],
['8-puzzle start h (misplaced tiles) for 283/164/7_5 =',['3','4','5','2'],1,'2, 8, 1, 6 are misplaced → 4.'],
['8-puzzle A* solution depth =',['3','5','7','4'],1,'Blank: up, up, left, down, right.'],
['If h(n) = 0 for every n, A* behaves like…',['DFS','Uniform-cost search','Greedy','Random walk'],1,'f = g.'],
['A consistent heuristic satisfies…',['h(n) ≥ h*(n)','h(n) ≤ c(n, n′) + h(n′)','h = 0','h(goal) = 1'],1,'The triangle inequality; consistent ⇒ admissible.'],
['A* stops when…',['The goal is generated','The goal is selected for expansion','The frontier is empty','After 10 steps'],1,'Stopping at generation can miss a cheaper path.'],
['Greedy on the Sample Test graph from S follows…',['S-A-B-C-E-G','S-B-D-G (cost 15)','S-A-C-E-G','S-B-C-E-G'],1,'Always lowest h: B(6) → D(4) → G(0): 4 + 5 + 6 = 15.'],
['Hill climbing that picks a random uphill neighbour is…',['Steepest ascent','Stochastic hill climbing','Random restart','Simulated annealing'],1,'Stochastic = random among improving moves.'],
['Word ordering with 5 unique words: search-space size =',['25','120','10','5'],1,'5! = 120.']]);
add('optim',[
['Δ = 6, T = 12 → SA acceptance probability ≈',['0.61','0.14','0.5','0.37'],0,'e^(−0.5) = 0.607.'],
['Δ = 6, T = 3 → probability ≈',['0.61','0.14','0.05','0.37'],1,'e^(−2) = 0.135.'],
['As T → 0, simulated annealing behaves like…',['Random walk','Hill climbing (greedy)','GA','BFS'],1,'Worse moves are almost never accepted.'],
['GA roulette: fitness 169, 576, 64, 361. P(576) =',['25%','49.2%','30.9%','14.4%'],1,'576 / 1170 = 0.492.'],
['Crossover of 11000 and 10011 after bit 2 → child 1 =',['11011','10000','11000','10111'],0,'11 | 011.'],
['Mutating bit 5 of 11011 gives…',['11010 (26)','01011','11111','11001'],0,'Flip the last bit: 26.'],
['Tabu search stores in the tabu list (usually)…',['Whole solutions','Move attributes (e.g. swapped pair)','Temperatures','Fitness values'],1,'Storing attributes is cheaper and more informative.'],
['The aspiration criterion allows…',['Any move','A tabu move if it gives a new best solution','Only worse moves','Restarting'],1,'Overrides the tabu status for exceptional moves.'],
['Exploration is also called…',['Intensification','Diversification','Exploitation','Cooling'],1,'Diversification = searching new regions.'],
['Which metaheuristic is memory-less (Markov)?',['Tabu search','Simulated annealing','ACO','Adaptive memory programming'],1,'SA does not use search history.'],
['In ACO, ρ is the…',['Population size','Pheromone evaporation rate','Mutation rate','Temperature'],1,'τ ← (1 − ρ)τ + deposit.'],
['Routes for 15 points with a fixed start =',['15!','14!','15²','2¹⁵'],1,'(n − 1)! = 14! ≈ 8.7 × 10¹⁰.'],
['Sample Test Q2a(i): limited memory, many trucks →',['Population-based','Trajectory-based','Exhaustive','Random'],1,'One solution at a time.'],
['GA chromosome for the TSP is best represented as…',['A bit string','A permutation of cities','A real number','A tree'],1,'Each city exactly once; use OX/PMX crossover.']]);
add('csp',[
['Sample Test Q2(b): initial domain of SB (2-hour task, finish by 5 h) =',['{1..5}','{1, 2, 3, 4}','{1, 2, 3}','{2..5}'],1,'Latest start = 5 − 2 + 1 = 4.'],
['Sample Test Q2(b): after SL = 2 with forward checking, SW =',['{1..5}','{1, 3, 4, 5}','{2}','{3, 4, 5}'],1,'Only SW is a neighbour of SL (SL ≠ SW).'],
['Sample Test Q2(b): after SL = 2, SH =',['{4}','{1, 2, 3, 4} (unchanged)','{3, 4}','∅'],1,'SH is not connected to SL.'],
['CSP exercise Q1: after SL = 2, SB =',['{1, 4}','{1}','{3, 4}','{1, 2, 3, 4}'],0,'Remove 2 (≠ SL) and 3 (≠ SL + 1).'],
['CSP exercise Q1: after SL = 2, SH =',['{3, 4}','{4}','{1..4}','∅'],1,'SL + 1 < SH → SH > 3.'],
['Graph colouring Q2: which assignment empties D(2) and D(7)?',['5 = R','8 = C','6 = B','4 = C'],2,'B is removed from neighbours 2 and 7, which only had B.'],
['A constraint mentioning one variable is…',['Binary','Unary','Global','Soft'],1,'e.g. SA ≠ green.'],
['Map colouring of Australia: which variable has the highest degree?',['WA','SA','T','V'],1,'SA touches 5 regions.'],
['Tasmania (T) in the map problem is…',['The most constrained','An independent sub-problem','Unsolvable','Always red'],1,'No edges.'],
['TO + GO = OUT: O =',['0','1','2','8'],1,'Two 2-digit numbers sum to at most 198 → O = 1.'],
['A STRIPS action has…',['Only a name','Preconditions, add list, delete list','A heuristic','A temperature'],1,'Classical planning representation.'],
['Arc X → Y is consistent if…',['Every value of Y has a value in X','Every value of X has some compatible value in Y','X = Y','D(X) is empty'],1,'Support in Y for every x.']]);
add('kr',[
['A frame with slots like colour and is-a is analogous to…',['A database index','A class/object in OOP','A neuron','A heuristic'],1,'Class frames, instance frames, inheritance.'],
['Rules R1: A ∧ B → C, R2: C → D; facts A, B. Forward chaining derives…',['Only C','C then D','Nothing','D only'],1,'Modus ponens twice.'],
['From ¬Q and P → Q, conclude ¬P. This is…',['Modus ponens','Modus tollens','Resolution','Induction'],1,'Modus tollens.'],
['Bayes: P(D) = 0.01, P(+|D) = 0.9, P(+|¬D) = 0.05 → P(D|+) ≈',['0.90','0.154','0.05','0.5'],1,'0.009 / 0.0585 = 0.154.'],
['Fuzzy logic represents…',['Only true/false','Degrees of truth in [0, 1]','Probabilities only','Heuristics'],1,'e.g. "warm" with membership 0.7.'],
['In a decision tree, the whole tree is a…',['Conjunction of paths','Disjunction of conjunctions','Single rule','Neural net'],1,'Each path = AND; tree = OR of paths.'],
['Backward chaining is best when…',['Many facts arrive and you monitor','A specific goal must be proved (diagnosis)','There are no rules','The data is images'],1,'Goal-driven: explores only relevant rules.'],
['The "mapping vs exploration" distinction: exploration means…',['Searching for a model','Searching the environment itself','Drawing maps','Sorting data'],1,'Lecture 2 Series.']]);
add('dtree',[
['Entropy of [2+, 3−] =',['0.971','0.811','1.0','0.5'],0,'−0.4·log₂0.4 − 0.6·log₂0.6 = 0.971.'],
['Entropy of [6+, 2−] =',['0.918','0.811','0.971','0.5'],1,'−0.75·log₂0.75 − 0.25·log₂0.25 = 0.811.'],
['Entropy of [6+, 1−] =',['0.592','0.985','0.811','0.4'],0,'Humidity = Normal branch.'],
['Entropy of [3+, 4−] =',['0.985','0.592','1','0.918'],0,'Humidity = High branch.'],
['Gain(S, Humidity) =',['0.151','0.246','0.048','0.029'],0,'0.940 − 0.5(0.985) − 0.5(0.592).'],
['Under Outlook = Sunny, which attribute is tested next?',['Wind','Humidity','Temperature','Outlook again'],1,'Gain 0.971 (perfect split).'],
['Under Outlook = Rain, which attribute is tested next?',['Humidity','Wind','Temperature','None'],1,'Weak → Yes, Strong → No.'],
['Loan data: Income [4+,1−]/[1+,4−] vs Student [3+,2−]/[2+,3−]. Root?',['Student','Income','Both equal','Neither'],1,'Gain 0.278 vs 0.029.'],
['A weighted child entropy uses the weight…',['1/2','|Sv| / |S|','p₊','Gain'],1,'Fraction of examples going down that branch.'],
['An attribute can appear on the same path at most…',['Twice','Once','Never','Any number of times'],1,'Attributes used higher up are excluded below.'],
['Clinic: 100 records [60, 40], Fever Yes [50, 10], No [10, 30]. Gain(Fever) ≈',['0.256','0.971','0.5','0.1'],0,'0.971 − 0.6(0.650) − 0.4(0.811).']]);
add('ann',[
['AND epoch 1, row (1, 0) with w1 = 0.5, w2 = −0.2, θ = 0.3: X =',['0.2','−0.3','0.5','0'],0,'1(0.5) + 0(−0.2) − 0.3 = 0.2 → Ya = 1, but Yd = 0 → e = −1.'],
['…then the new w1 = 0.5 + 0.2·1·(−1) =',['0.7','0.3','0.5','0.1'],1,'α·x·e = −0.2.'],
['…and the new θ = 0.3 − 0.2·(−1) =',['0.1','0.5','0.3','0.7'],1,'θ + α·(−1)·e = 0.3 + 0.2.'],
['A row with e = 0 means…',['Update all weights','No change to weights or θ','Reset','Stop training'],1,'Correct output → no update.'],
['OR perceptron final weights (course values) =',['w1 0.5, w2 0.2, θ 0.1','w1 0.3, w2 0.2, θ 0.5','w1 −0.5, w2 −0.2, θ −0.5','w1 1, w2 1, θ 1'],0,'Converges in epoch 4.'],
['Backprop XOR iteration 1 (x = 1, 1): Y3 = sig(0.1) ≈',['0.525','0.881','0.5','0.1'],0,'0.5 + 0.4 − 0.8 = 0.1.'],
['Y5 for that iteration ≈',['0.5097','0.6','0.4','0.88'],0,'sig(0.0389).'],
['δ5 = Y5(1 − Y5)·e with e = −0.5097 ≈',['−0.1274','0.1274','−0.5097','0.25'],0,'0.5097 × 0.4903 × (−0.5097).'],
['Hidden δ3 uses which w35?',['The new (updated) w35','The OLD w35 (before updating)','w13','θ5'],1,'Compute all gradients first, then update.'],
['New θ5 = 0.3 − 0.5(−0.1274) =',['0.3637','0.2363','0.3','0.1274'],0,'θ + α·(−1)·δ.'],
['Gradient descent on E = (w − 3)², w = 0, η = 0.1: next w =',['0.6','−0.6','3','0.3'],0,'w − η·2(w − 3) = 0 + 0.6.'],
['A learning rate that is too large causes…',['Slow learning','Overshooting / oscillation','No change','Guaranteed convergence'],1,'Steps jump over the minimum.'],
['Maximum value of the sigmoid derivative Y(1 − Y) is…',['1','0.25','0.5','0'],1,'At Y = 0.5.'],
['An MLP with one hidden layer can represent…',['Only linear functions','Any continuous function','Only XOR','Nothing'],1,'Lecture: one hidden layer, any continuous function.']]);
})();
