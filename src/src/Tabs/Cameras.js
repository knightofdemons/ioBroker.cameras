import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import MessageDialog from '@iobroker/adapter-react/Dialogs/Message';
import Fab from '@material-ui/core/Fab';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';

import IconDelete from '@material-ui/icons/Delete';
import IconEdit from '@material-ui/icons/Edit';
import IconAdd from '@material-ui/icons/Add';
import IconUp from '@material-ui/icons/ArrowUpward';
import IconDown from '@material-ui/icons/ArrowDownward';
import IconTest from '@material-ui/icons/Camera';

import I18n from '@iobroker/adapter-react/i18n';

import URLImage from '../Types/URLImage';
import URLBasicAuthImage from '../Types/URLBasicAuthImage';

const TYPES = {
    url:          {Config: URLImage, name: 'URL'},
    urlBasicAuth: {Config: URLBasicAuthImage, name: 'URL with basic auth'},
};

const COMMON_ATTRS = ['name', 'desc', 'type'];

const styles = theme => ({
    tab: {
        width: '100%',
        height: '100%'
    },
    lineDiv: {
        width: '100%',
        paddingBottom: 5,
        borderBottom: '1px dashed gray'
    },
    lineText: {
        display: 'inline-block',
        width: 200,
    },
    lineDesc: {
        display: 'inline-block',
        width: 'calc(100% - 600px)',
    },
    lineType: {
        display: 'inline-block',
        width: 200,
    },
    lineEdit: {
        display: 'inline-block',
        marginLeft: 10,
        marginTop: 10,
    },
    lineUp: {
        display: 'inline-block',
        marginLeft: 10,
        marginTop: 10,
    },
    lineDown: {
        display: 'inline-block',
        marginLeft: 10,
        marginTop: 10,
    },
    lineDelete: {
        display: 'inline-block',
        marginLeft: 10,
        marginTop: 10,
    },
    type: {
        width: '100%'
    },
    name: {
        width: 'calc(100% - 10px)',
    },
    desc: {
        width: 'calc(100% - 10px)',
    },
    lineNoButtonUp: {
        display: 'inline-block',
        width: 40,
        marginLeft: 10,
    },
    lineNoButtonDown: {
        display: 'inline-block',
        width: 40,
        marginLeft: 10,
    },
    divConfig: {
        verticalAlign: 'top',
        width: 'calc(100% - 300px)',
        display: 'inline-block'
    },
    divTestCam: {
        width: 300,
        display: 'inline-block',
        verticalAlign: 'top',
    },
    buttonTest: {},
    imgTest: {
        width: '100%',
        height: 'auto'
    }
});

class Server extends Component {
    constructor(props) {
        super(props);

        this.state = {
            editCam: false,
            editChanged: false,
            requesting: false,
            instanceAlive: this.props.instanceAlive
        };

        // translate all names once
        Object.keys(TYPES).forEach(type => {
            if (TYPES[type].name && !TYPES[type].translated) {
                TYPES[type].translated = true;
                TYPES[type].name = I18n.t(TYPES[type].name);
            }
        });
    }

    renderMessage() {
        if (this.state.message) {
            return (<MessageDialog text={this.state.message} onClose={() => this.setState({message: ''})}/>);
        } else {
            return null;
        }
    }

    static getDerivedStateFromProps(props, state) {
        if (state.instanceAlive !== props.instanceAlive) {
            return {instanceAlive: props.instanceAlive};
        }
    }

    onTest() {
        const settings = JSON.parse(this.editedSettings || this.editedSettingsOld);
        COMMON_ATTRS.forEach(attr => settings[attr] = this.props.native.cameras[this.state.editCam][attr]);

        let timeout = setTimeout(() => {
            timeout = null;
            this.setState({message: 'Timeout', requesting: false});
        }, settings.timeout || this.props.native.defaultTimeout);

        this.setState({requesting: true}, () => {
            this.props.socket.sendTo('cameras.' + this.props.instance, 'test', settings, result => {
                timeout && clearTimeout(timeout);
                if (!result || !result.body || result.error) {
                    let error = (result && result.error) ? result.error : I18n.t('No answer');
                    if (typeof error !== 'string') {
                        error = JSON.stringify(error);
                    }
                    this.setState({message: error, requesting: false});
                } else {
                    this.setState({testImg: result.body, requesting: false});
                }
            });
        });
    }

    renderConfigDialog() {
        if (this.state.editCam !== false) {
            const cam = this.props.native.cameras[this.state.editCam];
            let Config = (TYPES[cam.type] || TYPES.url).Config;

            return (<Dialog
                maxWidth="lg"
                fullWidth={true}
                open={true}
                onClose={() => this.state.editCam !== null && this.setState({editCam: false, editChanged: false})}
            >
                <DialogTitle>{I18n.t('Edit camera %s [%s]', cam.name, cam.type)}</DialogTitle>
                <DialogContent><div className={this.props.classes.divConfig}><Config
                    settings={cam}
                    onChange={settings => {
                        this.editedSettings = JSON.stringify(settings);
                        if (this.editedSettingsOld === this.editedSettings && this.state.editChanged) {
                            this.setState({editChanged: false});
                        } else if (this.editedSettingsOld !== this.editedSettings && !this.state.editChanged) {
                            this.setState({editChanged: true});
                        }
                    }}
                    encrypt={(value, cb) =>
                        this.props.encrypt(value, cb)}
                    decrypt={(value, cb) =>
                        this.props.decrypt(value, cb)}
                /></div>
                <div className={this.props.classes.divTestCam}>
                    <Button
                        disabled={this.state.requesting || !this.state.instanceAlive}
                        variant="contained"
                        color="primary"
                        size="small"
                        className={this.props.classes.buttonTest}
                        onClick={() => this.onTest()}
                        startIcon={<IconTest />}
                    >{I18n.t('Test')}</Button>
                    {this.state.testImg ? (<img alt="test" className={this.props.classes.imgTest} src={this.state.testImg} />) : null}
                </div>
                </DialogContent>
                <DialogActions>
                    <Button
                        disabled={!this.state.editChanged}
                        onClick={() => {
                        const cameras = JSON.parse(JSON.stringify(this.props.native.cameras));
                        if (this.editedSettings) {
                            const oldValue = cameras[this.state.editCam];
                            cameras[this.state.editCam] = JSON.parse(this.editedSettings);
                            COMMON_ATTRS.forEach(attr => cameras[this.state.editCam][attr] = oldValue[attr]);
                            this.props.onChange('cameras', cameras, () => this.setState({editCam: false, editChanged: false}));
                        } else {
                            this.setState({editCam: false, editChanged: false});
                        }
                    }} color="primary" >{I18n.t('Apply')}</Button>
                    <Button onClick={() => this.setState({editCam: false, editChanged: false})}>{I18n.t('Cancel')}</Button>
                </DialogActions>
            </Dialog>);
        } else {
            return null;
        }
    }

    renderCamera(cam, i) {
        const error = this.props.native.cameras.find((c, ii) => c.name === cam.name && ii !== i);
        return (<div key={'cam' + i} className={this.props.classes.lineDiv}>
            <div className={this.props.classes.lineText}>
                <TextField
                    className={this.props.classes.name}
                    label={I18n.t('Name')}
                    error={error}
                    value={cam.name}
                    helperText={error ? I18n.t('Duplicate name') : ''}
                    onChange={e => {
                        const cameras = JSON.parse(JSON.stringify(this.props.native.cameras));
                        cameras[i].name = e.target.value.replace(/[^-_\da-zA-Z]/g, '_');
                        this.props.onChange('cameras', cameras);
                    }}
                />
            </div>
            <div className={this.props.classes.lineDesc}>
                <TextField
                    className={this.props.classes.desc}
                    label={I18n.t('Description')}
                    value={cam.desc}
                    onChange={e => {
                        const cameras = JSON.parse(JSON.stringify(this.props.native.cameras));
                        cameras[i].desc = e.target.value;
                        this.props.onChange('cameras', cameras);
                    }}
                />
            </div>
            <div className={this.props.classes.lineType}>
                <FormControl className={this.props.classes.type}>
                    <InputLabel>{I18n.t('Type')}</InputLabel>
                    <Select
                        value={cam.type}
                        onChange={e => {
                            const cameras = JSON.parse(JSON.stringify(this.props.native.cameras));
                            cameras[i].type = e.target.value;
                            this.props.onChange('cameras', cameras);
                        }}
                    >
                        {Object.keys(TYPES).map(type => (<MenuItem value={type}>{TYPES[type].name || type}</MenuItem>))}
                    </Select>
                </FormControl>
            </div>
            {i ? (<Fab size="small" className={this.props.classes.lineUp} onClick={() => {
                const cameras = JSON.parse(JSON.stringify(this.props.native.cameras));
                const cam = cameras[i];
                cameras.splice(i, 1);
                cameras.splice(i - 1, 0, cam);
                this.props.onChange('cameras', cameras);
            }}><IconUp /></Fab>) : (<div className={this.props.classes.lineNoButtonUp}>&nbsp;</div>)}
            {i !== this.props.native.cameras.length - 1 ? (<Fab size="small" className={this.props.classes.lineDown} onClick={() => {
                const cameras = JSON.parse(JSON.stringify(this.props.native.cameras));
                const cam = cameras[i];
                cameras.splice(i, 1);
                cameras.splice(i + 1, 0, cam);
                this.props.onChange('cameras', cameras);
            }}><IconDown /></Fab>) : (<div className={this.props.classes.lineNoButtonDown}>&nbsp;</div>)}
            <Fab size="small" className={this.props.classes.lineEdit} onClick={() => {
                this.editedSettingsOld = JSON.parse(JSON.stringify(this.props.native.cameras[i]));
                COMMON_ATTRS.forEach(attr => {
                    console.log('delete ' + attr);
                    delete this.editedSettingsOld[attr];
                });
                this.editedSettingsOld = JSON.stringify(this.editedSettingsOld);
                this.setState({editCam: i});
            }}><IconEdit /></Fab>
            <Fab size="small" className={this.props.classes.lineDelete} onClick={() => {
                const cameras = JSON.parse(JSON.stringify(this.props.native.cameras));
                cameras.splice(i, 1);
                this.props.onChange('cameras', cameras);
            }}><IconDelete /></Fab>
        </div>);
    }

    render() {
        return (
            <div className={this.props.classes.tab}>
                <Fab size="small" onClick={() => {
                    const cameras = JSON.parse(JSON.stringify(this.props.native.cameras));
                    let i = 1;
                    while(cameras.find(cam => cam.name === 'cam' + i)) i++;
                    cameras.push({name: 'cam' + i, type: 'url'});
                    this.props.onChange('cameras', cameras);
                }}><IconAdd /></Fab>
                {this.props.native.cameras ? this.props.native.cameras.map((cam, i) => this.renderCamera(cam, i)) : null}
                {this.renderConfigDialog()}
                {this.renderMessage()}
            </div>
        );
    }
}

Server.propTypes = {
    common: PropTypes.object.isRequired,
    decrypt: PropTypes.func.isRequired,
    encrypt: PropTypes.func.isRequired,
    native: PropTypes.object.isRequired,
    instance: PropTypes.number.isRequired,
    adapterName: PropTypes.string.isRequired,
    onError: PropTypes.func,
    onLoad: PropTypes.func,
    onChange: PropTypes.func,
    socket: PropTypes.object.isRequired,
};

export default withStyles(styles)(Server);
