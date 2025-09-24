# Advanced Usage

Once you're comfortable with the basics of Manto, you can explore advanced features and techniques to create more sophisticated Discord server configurations.

## Best Practices

### Configuration Management

1. **Version Control**: Always use Git to track configuration changes
2. **Documentation**: Document complex permission setups
3. **Testing**: Test configurations in a development server first
4. **Backup**: Keep backups of working configurations
5. **Review**: Use pull requests for configuration changes

### Security Considerations

1. **Principle of Least Privilege**: Give users only the permissions they need
2. **Regular Audits**: Periodically review permissions and roles
3. **Sensitive Channels**: Protect sensitive information with proper permissions
4. **Bot Permissions**: Limit bot permissions to what's necessary

### Performance Tips

1. **Channel Limits**: Be mindful of Discord's channel limits

## Troubleshooting

### Common Issues

**Permission Conflicts**: When permissions don't work as expected, check:
- Role hierarchy order
- Channel-specific overrides
- Category-level permissions
- Discord's permission inheritance rules

**Validation Errors**: For schema validation issues:
- Check YAML syntax
- Verify required fields are present
- Ensure enum values match exactly
- Validate against the latest schema

**Deployment Failures**: When deployment fails:
- Verify bot permissions
- Check for naming conflicts
- Ensure all referenced roles exist
- Validate network connectivity

### Debugging Tools

Use Manto's built-in debugging features:
```bash
# Check for common issues
manto lint

# Fix linting issues
manto lint --fix

# Dry run deployment
manto push --dry-run
```

These advanced techniques will help you create sophisticated, maintainable Discord server configurations that scale with your community's needs.
