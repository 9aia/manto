# Getting Started <!-- omit in toc -->

## Table of Contents <!-- omit in toc -->

- [Common Issues and Solutions](#common-issues-and-solutions)
  - [Permission Errors](#permission-errors)
  - [Validation Errors](#validation-errors)
  - [Deployment Issues](#deployment-issues)
- [Next Steps](#next-steps)
  - [Advanced Configuration](#advanced-configuration)

## Common Issues and Solutions

### Permission Errors
- Ensure role names in `overwrites` match exactly with role names in `roles.yml`
- Check that you have the necessary permissions to create channels/roles

### Validation Errors
- Verify YAML syntax is correct
- Ensure all required fields are present
- Check that enum values match the schema exactly

### Deployment Issues
- Make sure the bot has sufficient permissions
- Verify the bot token is correct
- Check that channel names don't conflict with existing channels

---

Congratulations! You've created your first Manto configuration. Your Discord server is now defined as code, ready for version control and automated deployment.

## Next Steps

Now that you have a basic configuration, explore the [Overview](./overview.md) to understand how Manto works.

### Advanced Configuration

Once you're comfortable with the basics, explore:
- [Advanced Usage](./advanced-usage.md) for complex configurations
- [Examples](./examples.md) for real-world server setups
- Custom permission combinations
- Integration with CI/CD pipelines
