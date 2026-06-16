import re

def camel_to_snake(name):
    """Convert camelCase string to snake_case."""
    return re.sub(r'(?<!^)(?=[A-Z])', '_', name).lower()

def snake_to_camel(name):
    """Convert snake_case string to camelCase."""
    components = name.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

def convert_dict_keys(d, convert_fn):
    """Recursively convert dictionary keys using a custom conversion function."""
    if isinstance(d, dict):
        new_dict = {}
        for k, v in d.items():
            new_key = convert_fn(k)
            new_dict[new_key] = convert_dict_keys(v, convert_fn)
        return new_dict
    elif isinstance(d, list):
        return [convert_dict_keys(item, convert_fn) for item in d]
    else:
        return d
