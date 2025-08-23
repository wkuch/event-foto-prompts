# Todo
- The redirect after event creation to the event dashboard should not work, we should always require a login via magic link through email. Because otherwise someone can just input a email address of someone else and get access to that other persons events.
- The magic link email sending via "resend" currently does not work when deployed on vercel, research alternatives, we already have a email server running via docker mailserver https://github.com/docker-mailserver/docker-mailserver docu: https://docker-mailserver.github.io/docker-mailserver/latest/ maybe this can be used
- add a way to bulk add prompts in the dashboard, maybe simply via txt file where each prompt is a new line
