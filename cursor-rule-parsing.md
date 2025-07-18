## 형식

cursor rule은 항상 아래와 같은 형식으로 시작한다.

```
---
description:
globs:
alwaysApply: false
---
```

위 metadata 내용을 별도로 기억하고, 본문만 markdown 파일 내에 포함해야한다.

## 추가 규칙

기억한 metadata 내용에 따라 다음과 같이 `_root.md` 파일에 참조를 생성한다.
alwaysApply, description, globs중 하나만 해당할 수 있다. 각 rule은 하나의 참조만 가지며, 우선순위는 alwaysApply > description > globs 순이다.

```
always apply below rules
- rule-name: @rule-markdown-path
...

apply below rules if requirement matches
- rule-name
    - description: rule-description
    - path: rule-markdown-path
...

apply below rules if glob pattern matches with related files:
- rule-name
    - glob: rule-glob-pattern
    - path: rule-markdown-path
...




```
