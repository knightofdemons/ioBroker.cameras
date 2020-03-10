import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import I18n from '@iobroker/adapter-react/i18n';
import TextField from '@material-ui/core/TextField';

const styles = theme => ({
    page: {

    },
    url: {
        width: '100%'
    }
});

class Config extends Component {
    constructor(props) {
        super(props);

        const state = JSON.parse(JSON.stringify(this.props.settings));
        state.password = state.password || '';
        state.username = state.username || '';

        this.state = state;
    }

    componentDidMount() {
        this.props.decrypt(this.state.password,
            password => this.setState({password}));
    }

    reportSettings() {
        this.props.encrypt(this.state.password, password => {
            this.props.onChange({
                url:      this.state.url,
                username: this.state.username,
                password: password
            });
        });
    }

    render() {
        return (
            <div className={this.props.classes.page}>
                <TextField
                    key="url"
                    className={this.props.classes.url}
                    label={I18n.t('Camera URL')}
                    value={this.state.url}
                    onChange={e => this.setState({url: e.target.value}, () => this.reportSettings())}
                />
                <br/>
                <TextField
                    key="username"
                    autoComplete="off"
                    className={this.props.classes.username}
                    label={I18n.t('Username')}
                    value={this.state.username}
                    onChange={e => this.setState({username: e.target.value}, () => this.reportSettings())}
                />
                <br/>
                <TextField
                    key="password"
                    type="password"
                    autoComplete="off"
                    className={this.props.classes.password}
                    label={I18n.t('Password')}
                    value={this.state.password}
                    onChange={e => this.setState({password: e.target.value}, () => this.reportSettings())}
                />
            </div>
        );
    }
}

Config.propTypes = {
    onChange: PropTypes.func,
    decode: PropTypes.func,
    encode: PropTypes.func,
};

export default withStyles(styles)(Config);
