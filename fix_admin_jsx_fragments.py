lines = open('src/components/AdminPortal.tsx', 'r').readlines()
lines[1866-1] = lines[1866-1].replace(') : (', ') : (<>')
open('src/components/AdminPortal.tsx', 'w').writelines(lines)
