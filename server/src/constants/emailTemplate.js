export const severeIssueAlertTemplate = ({name, pinCode, issues}) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Severe Issue Alert</title>
</head>
<body style="font-family: Arial, sans-serif;">
    <h2>Important Alert for Area ${pinCode}</h2>

    <p>Hello ${name || 'User'},</p>

    <p>
        One or more severe issues have been reported in your area.
        Please stay alert and follow safety guidelines.
    </p>

    <ul>
        ${issues
            .map(
                (issue) => `
            <li>
                <strong>${issue.title}</strong><br />
                Location: ${issue.location}<br />
                Severity: ${issue.severity}<br />
                Date: ${new Date(issue.date).toLocaleDateString()}
            </li>
        `
            )
            .join('')}
    </ul>

    <p>
        This is an automated alert to help keep you informed.
    </p>

    <p>
        Stay safe,<br />
        TEAM CodeBlooded
    </p>
</body>
</html>
`;
